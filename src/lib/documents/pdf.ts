import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  degrees,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  translate,
  type RGB,
} from 'pdf-lib';
import {
  GOODS_CATEGORIES,
  PAYMENT_METHODS,
  formatAmount,
  formatDocumentDate,
  type DocumentRecord,
} from '@/lib/documents/types';

/**
 * The printed receipt / invoice.
 *
 * This is a faithful reproduction of the pad the client already uses — the two
 * sample PDFs they sent were measured and the geometry below matches them: an
 * A4-width page exactly half an A4 tall, so an ORIGINAL and its DUPLICATE stack
 * on one sheet with a tear line between them. Staff who have filled in the
 * paper version for years should recognise this without being told anything.
 *
 * Drawn with pdf-lib against the fourteen standard PDF fonts rather than with
 * an HTML-to-PDF pipeline. Three reasons, in order of weight:
 *
 *  1. It is a fixed form, not flowing text. Every box, rule and tick has a
 *     position on the paper, and stating those positions directly is both
 *     shorter and more faithful than talking a layout engine into them.
 *  2. Nothing to install and nothing to download at runtime. Headless Chrome
 *     is ~300MB and does not fit a serverless function; embedding the brand's
 *     web fonts would mean shipping font binaries and hoping the file tracer
 *     packs them. Helvetica is inside every PDF reader ever written.
 *  3. It generates in a few milliseconds, which matters because a receipt is
 *     produced inside the request that takes the customer's money.
 *
 * The one embedded asset is the company logo, read from `public/brand/`.
 */

/* -------------------------------------------------------------------------- */
/* Brand                                                                       */
/* -------------------------------------------------------------------------- */

function hex(value: string): RGB {
  return rgb(
    parseInt(value.slice(1, 3), 16) / 255,
    parseInt(value.slice(3, 5), 16) / 255,
    parseInt(value.slice(5, 7), 16) / 255
  );
}

const NAVY = hex('#0B2A6B');
const NAVY_INK = hex('#0A1733');
const ORANGE = hex('#F26A21');
const GOLD = hex('#FDB913');
const GREEN = hex('#3FA535');
const WHITE = hex('#FFFFFF');
const MIST = hex('#F4F6FB');
const LINE = hex('#DCE3F0');
const SLATE = hex('#5A6784');
/** The faint fill behind a figure in the summary box. */
const FIGURE_TINT = hex('#EDF1FA');

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** A4 width, half A4 height — two copies to a sheet, as the pad is printed. */
const PAGE_W = 595.28;
const PAGE_H = 420.94;

const FRAME = 12; // margin from the paper edge to the navy card border
const PAD = 14; // inside the card border to the content
const LEFT = FRAME + PAD;
const RIGHT = PAGE_W - FRAME - PAD;
const CONTENT_W = RIGHT - LEFT;

/** Item table columns, as x positions of each column's right edge. */
const COL_QTY_R = LEFT + CONTENT_W * 0.585;
const COL_UNIT_R = LEFT + CONTENT_W * 0.79;
const COL_AMOUNT_R = RIGHT;
const COL_DESC_R = LEFT + CONTENT_W * 0.5;

/** The pad prints five ruled item rows whether or not they are all used. */
const MIN_ITEM_ROWS = 5;
const ROW_H = 14;

/**
 * The half-page is a tight budget and every band below is sized to fit it with
 * five item rows: header 62, title 26, goods 17, customer 26, table 84,
 * summary 92, signatures 22, footer 34. Growing any of them takes the space
 * from the one below, so change these together and re-run
 * `scripts/preview-document.ts` to see it.
 */
const SIGNATURE_RULE_Y = FRAME + 58;
const FOOTER_RULE_Y = FRAME + 32;

export type CopyKind = 'original' | 'duplicate';

type Fonts = { regular: PDFFont; bold: PDFFont; oblique: PDFFont };

/* -------------------------------------------------------------------------- */
/* Drawing helpers                                                             */
/* -------------------------------------------------------------------------- */

type TextOptions = {
  size?: number;
  font?: PDFFont;
  colour?: RGB;
  /** Letter-spacing, in points. The pad sets its small labels wide. */
  tracking?: number;
};

/** Width of a string once tracking is applied, for right- and centre-alignment. */
function widthOf(text: string, font: PDFFont, size: number, tracking = 0): number {
  const base = font.widthOfTextAtSize(text, size);
  return tracking ? base + tracking * Math.max(0, text.length - 1) : base;
}

/**
 * Draw text with optional letter-spacing.
 *
 * pdf-lib has no tracking parameter, so a tracked string is drawn one glyph at
 * a time. Only used for the small uppercase labels, which are a few characters
 * each — the cost is irrelevant and the look is what makes the form read as
 * printed stationery rather than as a word-processor table.
 */
function draw(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  fonts: Fonts,
  options: TextOptions = {}
): number {
  const size = options.size ?? 8;
  const font = options.font ?? fonts.regular;
  const colour = options.colour ?? NAVY_INK;
  const tracking = options.tracking ?? 0;

  if (!tracking) {
    page.drawText(text, { x, y, size, font, color: colour });
    return widthOf(text, font, size);
  }

  let cursor = x;
  for (const char of text) {
    page.drawText(char, { x: cursor, y, size, font, color: colour });
    cursor += font.widthOfTextAtSize(char, size) + tracking;
  }
  return cursor - x - tracking;
}

function drawRight(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  fonts: Fonts,
  options: TextOptions = {}
): void {
  const size = options.size ?? 8;
  const font = options.font ?? fonts.regular;
  draw(page, text, rightX - widthOf(text, font, size, options.tracking), y, fonts, options);
}

function drawCentre(
  page: PDFPage,
  text: string,
  centreX: number,
  y: number,
  fonts: Fonts,
  options: TextOptions = {}
): void {
  const size = options.size ?? 8;
  const font = options.font ?? fonts.regular;
  draw(
    page,
    text,
    centreX - widthOf(text, font, size, options.tracking) / 2,
    y,
    fonts,
    options
  );
}

function rule(page: PDFPage, x1: number, y: number, x2: number, colour = LINE, thickness = 0.5) {
  page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: colour });
}

/** The dotted lead-in the pad uses for a field a person writes on. */
function dottedRule(page: PDFPage, x1: number, y: number, x2: number, colour = LINE) {
  page.drawLine({
    start: { x: x1, y },
    end: { x: x2, y },
    thickness: 0.5,
    color: colour,
    dashArray: [0.7, 1.6],
  });
}

/**
 * A tick box. Ticked boxes take a hand-drawn-looking cross rather than a tidy
 * glyph, because the standard fonts have no check mark and substituting a
 * lookalike character risks it rendering as a hollow box in some readers.
 */
function tickBox(page: PDFPage, x: number, y: number, ticked: boolean, size = 6.6) {
  page.drawRectangle({
    x,
    y,
    width: size,
    height: size,
    borderColor: ticked ? NAVY : SLATE,
    borderWidth: ticked ? 0.9 : 0.6,
  });
  if (!ticked) return;
  const inset = 1.4;
  const stroke = { thickness: 1.1, color: NAVY };
  page.drawLine({
    start: { x: x + inset, y: y + inset },
    end: { x: x + size - inset, y: y + size - inset },
    ...stroke,
  });
  page.drawLine({
    start: { x: x + inset, y: y + size - inset },
    end: { x: x + size - inset, y: y + inset },
    ...stroke,
  });
}

/**
 * Cut a string to fit a column, ending in an ellipsis if it had to be cut.
 *
 * Descriptions are typed by staff and pasted from product names, some of which
 * are very long. A row that silently overflows would print over the QTY column
 * and make the document look broken; truncating is visible and honest, and the
 * admin form warns while there is still time to shorten it.
 */
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > maxWidth) {
    cut = cut.slice(0, -1);
  }
  return `${cut.trimEnd()}…`;
}

/* -------------------------------------------------------------------------- */
/* Logo                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The company's own KRA PIN.
 *
 * A tax invoice under the VAT Act must identify the supplier by PIN, so this
 * is not decoration. It comes from the environment rather than being written
 * into the code because the figure is the client's to supply and inventing a
 * plausible-looking one would be worse than leaving it out — see
 * PLACEHOLDERS.md. Unset, the line simply does not render: no token, no
 * half-filled field, nothing a customer could mistake for a real PIN.
 */
function sellerPin(): string | null {
  return process.env.ORIEL_KRA_PIN?.trim() || null;
}

let logoCache: Uint8Array | null | undefined;

/**
 * The logo, read once per process from `public/`.
 *
 * `public/` is bundled with the serverless function, so this survives
 * deployment without a file-tracing hint. A missing or unreadable file is
 * cached as null and the header falls back to the company name set in type —
 * a receipt with no picture is still a valid receipt, and failing to produce
 * one at all because of a decorative asset would be indefensible.
 */
async function loadLogo(): Promise<Uint8Array | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public', 'brand', 'oriel-logo.jpg'));
    logoCache = new Uint8Array(file);
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

function drawFrame(page: PDFPage) {
  // The card itself.
  page.drawRectangle({
    x: FRAME,
    y: FRAME,
    width: PAGE_W - FRAME * 2,
    height: PAGE_H - FRAME * 2,
    borderColor: NAVY,
    borderWidth: 1.1,
    color: WHITE,
  });
  // Green foot — the brief's secondary colour, carrying the eco line.
  page.drawRectangle({
    x: FRAME + 1,
    y: FRAME + 1,
    width: PAGE_W - FRAME * 2 - 2,
    height: 4,
    color: GREEN,
  });
}

/**
 * The faint gold rays behind the top-right corner, reproduced from the client's
 * own sample. Drawn first so everything else sits over it.
 */
function drawSunRays(page: PDFPage) {
  const originX = PAGE_W - FRAME - 6;
  const originY = PAGE_H - FRAME - 6;
  // Sweeping from due west round to due south, so every ray stays on the page.
  for (let i = 0; i < 9; i += 1) {
    const angle = Math.PI + (i / 8) * (Math.PI / 2);
    const length = 78 + (i % 3) * 16;
    page.drawLine({
      start: { x: originX, y: originY },
      end: { x: originX + Math.cos(angle) * length, y: originY + Math.sin(angle) * length },
      thickness: 2.4,
      color: GOLD,
      opacity: 0.13,
    });
  }
}

async function drawHeader(
  pdf: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  copy: CopyKind
): Promise<number> {
  const top = PAGE_H - FRAME - PAD;
  let logoRight = LEFT;

  const logo = await loadLogo();
  if (logo) {
    const image = await pdf.embedJpg(logo);
    const w = 104;
    const h = (image.height / image.width) * w;
    page.drawImage(image, { x: LEFT, y: top - h, width: w, height: h });
    logoRight = LEFT + w;
  } else {
    draw(page, 'ORIEL POWER LTD', LEFT, top - 16, fonts, {
      size: 13,
      font: fonts.bold,
      colour: NAVY,
    });
    logoRight = LEFT + 104;
  }

  // Hairline between the mark and the strapline, as on the pad.
  page.drawLine({
    start: { x: logoRight + 12, y: top - 2 },
    end: { x: logoRight + 12, y: top - 52 },
    thickness: 0.6,
    color: LINE,
  });

  const textX = logoRight + 24;
  draw(page, 'Clean energy, more savings, brighter tomorrow.', textX, top - 12, fonts, {
    size: 9.5,
    font: fonts.bold,
    colour: ORANGE,
  });
  draw(page, 'SOLAR SUPPLY · INSTALLATION · MAINTENANCE', textX, top - 24, fonts, {
    size: 5.6,
    font: fonts.bold,
    colour: NAVY,
    tracking: 1.15,
  });

  // Contact strip — labels bold, values regular, laid out on one line.
  let x = textX;
  const contact: [string, string][] = [
    ['Nairobi,', ' Kenya'],
    ['Tel', ' 0723 204 342'],
    ['Email', ' info@orielpower.com'],
    ['Web', ' orielpower.com'],
  ];
  for (const [label, value] of contact) {
    x += draw(page, label, x, top - 40, fonts, { size: 7.2, font: fonts.bold, colour: NAVY });
    x += draw(page, value, x, top - 40, fonts, { size: 7.2, colour: NAVY_INK });
    x += 9;
  }

  // The supplier's PIN, on its own line rather than appended to the strip
  // above: the strip already runs close to the copy badge, and a tax invoice
  // is not the document on which to let an identifier collide with anything.
  const pin = sellerPin();
  if (pin) {
    const pinLabelW = draw(page, 'PIN', textX, top - 51, fonts, {
      size: 7.2,
      font: fonts.bold,
      colour: NAVY,
    });
    draw(page, ` ${pin}`, textX + pinLabelW, top - 51, fonts, {
      size: 7.2,
      font: fonts.bold,
      colour: NAVY_INK,
    });
  }

  // Copy badge. ORIGINAL is navy and belongs to the customer; DUPLICATE is
  // orange, stays in the shop, and must be tellable apart at arm's length in a
  // stack of paper — which is why the colour, not just the word, changes.
  const isOriginal = copy === 'original';
  const badgeW = 92;
  const badgeH = 30;
  const badgeX = RIGHT - badgeW;
  const badgeY = top - badgeH + 2;
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    borderColor: isOriginal ? NAVY : ORANGE,
    borderWidth: 0.9,
  });
  drawCentre(page, isOriginal ? 'ORIGINAL' : 'DUPLICATE', badgeX + badgeW / 2, badgeY + 17, fonts, {
    size: 10,
    font: fonts.bold,
    colour: isOriginal ? NAVY : ORANGE,
    tracking: 0.5,
  });
  drawCentre(
    page,
    isOriginal ? 'CUSTOMER COPY' : 'OFFICE COPY',
    badgeX + badgeW / 2,
    badgeY + 6,
    fonts,
    { size: 5.6, colour: SLATE, tracking: 0.5 }
  );

  return top - 62;
}

function drawTitleBar(
  page: PDFPage,
  fonts: Fonts,
  y: number,
  doc: DocumentRecord
): number {
  const h = 26;
  const barY = y - h;
  page.drawRectangle({ x: LEFT, y: barY, width: CONTENT_W, height: h, color: NAVY });

  // Two-tone title, matching the pad: the noun in gold, its qualifier in white.
  // "TAX INVOICE" is used because the client confirmed on 2026-08-07 that they
  // are ETR-registered. It is a defined document under the VAT Act, which is
  // why the header prints the company's KRA PIN — see sellerPin() below.
  const [first, second] =
    doc.docType === 'receipt' ? ['PAYMENT ', 'RECEIPT'] : ['TAX ', 'INVOICE'];
  const titleY = barY + 8;
  const w1 = draw(page, first, LEFT + 12, titleY, fonts, {
    size: 14.5,
    font: fonts.bold,
    colour: WHITE,
    tracking: 0.4,
  });
  draw(page, second, LEFT + 12 + w1 + 0.4, titleY, fonts, {
    size: 14.5,
    font: fonts.bold,
    colour: GOLD,
    tracking: 0.4,
  });

  // Number and date, right-aligned inside the bar.
  const dateText = formatDocumentDate(doc.issuedAt ?? doc.createdAt);
  const dateW = widthOf(dateText, fonts.bold, 8.5);
  const dateFieldX = RIGHT - 12 - Math.max(dateW, 54);
  draw(page, 'DATE', dateFieldX - 24, titleY + 1, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: WHITE,
    tracking: 0.8,
  });
  draw(page, dateText, dateFieldX, titleY + 1, fonts, { size: 8.5, font: fonts.bold, colour: GOLD });
  dottedRule(page, dateFieldX, titleY - 2.5, RIGHT - 12, rgb(1, 1, 1));

  const numberText = doc.docNumber ?? 'DRAFT';
  const numberFieldX = dateFieldX - 24 - 8 - Math.max(widthOf(numberText, fonts.bold, 8.5), 62);
  draw(page, 'NO.', numberFieldX - 16, titleY + 1, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: WHITE,
    tracking: 0.8,
  });
  draw(page, numberText, numberFieldX, titleY + 1, fonts, {
    size: 8.5,
    font: fonts.bold,
    colour: GOLD,
  });
  dottedRule(page, numberFieldX, titleY - 2.5, numberFieldX + 62, rgb(1, 1, 1));

  return barY;
}

function drawGoodsRow(page: PDFPage, fonts: Fonts, y: number, doc: DocumentRecord): number {
  const h = 17;
  const rowY = y - h;
  page.drawRectangle({ x: LEFT, y: rowY, width: CONTENT_W, height: h, color: MIST });

  const labelW = draw(page, 'GOODS / SERVICE', LEFT + 10, rowY + 6, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });

  // The boxes are laid out by measured width with the slack shared evenly
  // between them, NOT on a fixed step. "Installation / Labour" is more than
  // twice the width of "Batteries", so an even step puts one label straight
  // through the next box — which is exactly what it did on the first render.
  const LABEL_SIZE = 6.2;
  const BOX_TO_LABEL = 9.5;
  const boxesX = LEFT + 10 + labelW + 12;
  const available = RIGHT - 8 - boxesX;
  const widths = GOODS_CATEGORIES.map(
    (c) => BOX_TO_LABEL + widthOf(c.label, fonts.regular, LABEL_SIZE)
  );
  const natural = widths.reduce((sum, w) => sum + w, 0);
  const gap = Math.max(3, (available - natural) / (GOODS_CATEGORIES.length - 1));

  let x = boxesX;
  GOODS_CATEGORIES.forEach((category, i) => {
    tickBox(page, x, rowY + 5, doc.goodsCategories.includes(category.id));
    draw(page, category.label, x + BOX_TO_LABEL, rowY + 6, fonts, {
      size: LABEL_SIZE,
      colour: NAVY_INK,
    });
    x += widths[i] + gap;
  });

  return rowY;
}

function drawCustomerRow(page: PDFPage, fonts: Fonts, y: number, doc: DocumentRecord): number {
  const rowY = y - 22;

  draw(page, 'RECEIVED FROM', LEFT, rowY + 4, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });
  const nameX = LEFT + 62;
  const nameMax = COL_DESC_R - 8 - nameX;
  draw(page, fit(doc.customerName, fonts.bold, 10, nameMax), nameX, rowY + 4, fonts, {
    size: 10,
    font: fonts.bold,
    colour: NAVY_INK,
  });
  dottedRule(page, nameX, rowY, COL_DESC_R - 8);

  draw(page, 'PHONE / ADDRESS', COL_DESC_R + 8, rowY + 4, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });
  const contactX = COL_DESC_R + 78;
  // The buyer's PIN rides here when there is one. On a tax invoice it is what
  // lets a business customer claim the input VAT back, so it belongs on the
  // document rather than only in the back office.
  const contact = [
    doc.customerPhone,
    doc.customerAddress,
    doc.kraPin ? `PIN ${doc.kraPin}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (contact) {
    draw(page, fit(contact, fonts.regular, 8, RIGHT - contactX), contactX, rowY + 4, fonts, {
      size: 8,
      colour: NAVY_INK,
    });
  }
  dottedRule(page, contactX, rowY, RIGHT);

  return rowY - 4;
}

function drawItemsTable(page: PDFPage, fonts: Fonts, y: number, doc: DocumentRecord): number {
  const headH = 14;
  const headY = y - headH;
  page.drawRectangle({ x: LEFT, y: headY, width: CONTENT_W, height: headH, color: NAVY });

  const headOpts = { size: 5.8, font: fonts.bold, colour: WHITE, tracking: 0.7 } as const;
  draw(page, 'DESCRIPTION OF GOODS / SERVICES', LEFT + 8, headY + 4.5, fonts, headOpts);
  drawCentre(page, 'QTY', (COL_DESC_R + COL_QTY_R) / 2, headY + 4.5, fonts, headOpts);

  /**
   * The column headings say whether the figures beneath them carry VAT.
   *
   * This is the one place the document could genuinely mislead. In inclusive
   * mode the line amounts already contain VAT, so they add up to TOTAL DUE and
   * NOT to the SUBTOTAL printed below them — a customer totting up the column
   * and landing 35,000 away from the subtotal has every reason to think they
   * have been overcharged. Saying "INCL. VAT" in the heading costs nothing and
   * removes the whole question.
   */
  const inclusive = doc.vatMode === 'inclusive';
  const vatTag = doc.vatMode === 'none' ? '' : inclusive ? ' INCL. VAT' : ' EXCL. VAT';
  drawRight(page, `UNIT PRICE (KES)${vatTag}`, COL_UNIT_R - 8, headY + 4.5, fonts, headOpts);
  drawRight(page, `AMOUNT (KES)${vatTag}`, COL_AMOUNT_R - 8, headY + 4.5, fonts, headOpts);

  const rowCount = Math.max(doc.lines.length, MIN_ITEM_ROWS);
  let rowY = headY;

  for (let i = 0; i < rowCount; i += 1) {
    rowY -= ROW_H;
    const line = doc.lines[i];
    const baseline = rowY + 4.5;

    if (line) {
      draw(
        page,
        fit(line.description, fonts.regular, 8.6, COL_DESC_R - LEFT - 14),
        LEFT + 8,
        baseline,
        fonts,
        { size: 8.6, colour: NAVY_INK }
      );
      drawCentre(page, String(line.quantity), (COL_DESC_R + COL_QTY_R) / 2, baseline, fonts, {
        size: 8.6,
        colour: NAVY_INK,
      });
      drawRight(
        page,
        line.unitPrice == null ? '-' : formatAmount(line.unitPrice),
        COL_UNIT_R - 8,
        baseline,
        fonts,
        { size: 8.6, colour: NAVY_INK }
      );
      drawRight(page, formatAmount(line.amount), COL_AMOUNT_R - 8, baseline, fonts, {
        size: 8.6,
        colour: NAVY_INK,
      });
    }

    // Every row is ruled whether or not it carries an item, so the block keeps
    // the shape of the printed pad and nobody can add a line afterwards.
    rule(page, LEFT, rowY, RIGHT, LINE);
  }

  // Column separators, drawn once over the full height of the block.
  for (const x of [COL_DESC_R, COL_QTY_R, COL_UNIT_R]) {
    page.drawLine({
      start: { x, y: headY },
      end: { x, y: rowY },
      thickness: 0.5,
      color: LINE,
    });
  }
  // Outer edges.
  for (const x of [LEFT, RIGHT]) {
    page.drawLine({ start: { x, y: headY }, end: { x, y: rowY }, thickness: 0.5, color: LINE });
  }

  return rowY;
}

function drawPaymentMethod(page: PDFPage, fonts: Fonts, y: number, doc: DocumentRecord) {
  const colR = COL_DESC_R - 8;
  draw(page, 'PAYMENT METHOD', LEFT, y - 10, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });

  const step = (colR - LEFT) / PAYMENT_METHODS.length;
  PAYMENT_METHODS.forEach((method, i) => {
    const x = LEFT + i * step;
    tickBox(page, x, y - 27, doc.paymentMethod === method.id, 7);
    draw(page, method.label, x + 10, y - 26, fonts, { size: 7.4, colour: NAVY_INK });
  });

  // Reference fields. All three are always printed — the pad prints them all
  // and a blank line is how a paper form says "not applicable".
  const fields: [string, string | null][] = [
    ['M-PESA TILL / PAYBILL NO.', doc.mpesaTill],
    ['M-PESA TRANSACTION CODE', doc.mpesaCode],
    ['BANK / CHEQUE REF.', doc.bankRef],
  ];
  let fieldY = y - 41;
  for (const [label, value] of fields) {
    const labelW = draw(page, label, LEFT, fieldY, fonts, {
      size: 5.8,
      font: fonts.bold,
      colour: NAVY,
      tracking: 0.7,
    });
    const valueX = LEFT + labelW + 8;
    if (value) {
      draw(page, fit(value, fonts.bold, 7.6, colR - valueX), valueX, fieldY, fonts, {
        size: 7.6,
        font: fonts.bold,
        colour: NAVY_INK,
      });
    }
    dottedRule(page, valueX, fieldY - 2.5, colR);
    fieldY -= 13;
  }
}

function drawSummary(page: PDFPage, fonts: Fonts, y: number, doc: DocumentRecord) {
  const boxL = COL_DESC_R + 8;
  const figureL = boxL + (RIGHT - boxL) * 0.62;

  draw(page, 'SUMMARY', boxL, y - 10, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });

  type Row = {
    label: string;
    value: number;
    /** The total is the one figure a reader should find without looking. */
    emphasis?: 'total' | 'paid';
    suffix?: string;
  };

  // In inclusive mode the subtotal is a figure the customer cannot get by
  // adding the column up, so it says what it is. In exclusive mode the column
  // does sum to it and the plain word is right.
  const inclusive = doc.vatMode === 'inclusive';
  const rows: Row[] = [
    { label: inclusive ? 'SUBTOTAL EXCL. VAT' : 'SUBTOTAL', value: doc.subtotal },
  ];
  if (doc.vatMode !== 'none') {
    const rate = doc.vatRate % 1 === 0 ? doc.vatRate : doc.vatRate.toFixed(1);
    rows.push({
      label: inclusive ? `VAT @ ${rate} % INCLUDED` : `VAT @ ${rate} %`,
      value: doc.vatAmount,
    });
  }
  rows.push({ label: 'TOTAL DUE', value: doc.total, emphasis: 'total' });
  rows.push({ label: 'AMOUNT PAID', value: doc.amountPaid, emphasis: 'paid' });
  rows.push({ label: 'BALANCE', value: doc.balance });

  const rowH = 15;
  let rowY = y - 16 - rowH;

  for (const row of rows) {
    const isTotal = row.emphasis === 'total';

    if (isTotal) {
      page.drawRectangle({ x: boxL, y: rowY, width: RIGHT - boxL, height: rowH, color: NAVY });
    } else {
      // Only the figure half is tinted, which is what makes the numbers form a
      // column the eye can run down.
      page.drawRectangle({
        x: figureL,
        y: rowY,
        width: RIGHT - figureL,
        height: rowH,
        color: FIGURE_TINT,
      });
    }

    if (row.emphasis === 'paid') {
      // Green tab — the brief's colour for money that has actually landed.
      page.drawRectangle({ x: boxL, y: rowY, width: 2.4, height: rowH, color: GREEN });
    }

    const labelColour = isTotal ? WHITE : NAVY;
    const labelW = draw(page, row.label, boxL + 8, rowY + 5, fonts, {
      size: 6.6,
      font: fonts.bold,
      colour: labelColour,
      tracking: 0.7,
    });
    draw(page, 'KES', boxL + 8 + labelW + 4, rowY + 5, fonts, {
      size: 5.6,
      font: fonts.bold,
      colour: isTotal ? GOLD : SLATE,
      tracking: 0.5,
    });

    drawRight(page, formatAmount(row.value), RIGHT - 8, rowY + 4.5, fonts, {
      size: isTotal ? 10.5 : 9.5,
      font: fonts.bold,
      colour: isTotal ? WHITE : NAVY_INK,
    });

    if (!isTotal) rule(page, boxL, rowY, RIGHT, LINE);
    rowY -= rowH;
  }
}

function drawSignatures(page: PDFPage, fonts: Fonts, y: number) {
  const colR = COL_DESC_R - 8;
  const rightL = COL_DESC_R + 8;

  rule(page, LEFT, y, colR - 60, NAVY, 0.8);
  draw(page, 'RECEIVED BY', LEFT, y - 9, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });
  draw(page, 'Name & signature — for Oriel Power Ltd', LEFT, y - 17, fonts, {
    size: 5.8,
    colour: SLATE,
  });

  rule(page, rightL, y, RIGHT, NAVY, 0.8);
  draw(page, 'CUSTOMER SIGNATURE', rightL, y - 9, fonts, {
    size: 5.8,
    font: fonts.bold,
    colour: NAVY,
    tracking: 0.8,
  });
  draw(page, 'Goods / services received in good order', rightL, y - 17, fonts, {
    size: 5.8,
    colour: SLATE,
  });
}

function drawFooter(page: PDFPage, fonts: Fonts, doc: DocumentRecord) {
  const baseline = FOOTER_RULE_Y - 11;
  rule(page, LEFT, FOOTER_RULE_Y, RIGHT, LINE);

  const w = draw(page, 'Asante sana — ', LEFT, baseline, fonts, {
    size: 8.4,
    font: fonts.bold,
    colour: NAVY,
  });
  draw(page, 'powering a cleaner future, one roof at a time.', LEFT + w, baseline, fonts, {
    size: 8.4,
    font: fonts.bold,
    colour: ORANGE,
  });

  // Laid out right to left so the block ends flush with the card edge. The
  // separator is drawn BEFORE each pair except the last one placed, which is
  // the leftmost — otherwise the strip opens with a stray middot.
  let x = RIGHT;
  const contact: [string, string][] = [
    ['Web', 'orielpower.com'],
    ['Email', 'info@orielpower.com'],
    ['Tel / WhatsApp', '0723 204 342'],
  ];
  contact.forEach(([label, value], i) => {
    x -= widthOf(value, fonts.regular, 6.8);
    draw(page, value, x, baseline, fonts, { size: 6.8, colour: NAVY_INK });
    // Helvetica's space at 6.8pt is under two points, which is not enough to
    // separate a bold label from the value it introduces. Set the gap.
    x -= widthOf(label, fonts.bold, 6.8) + 2.5;
    draw(page, label, x, baseline, fonts, { size: 6.8, font: fonts.bold, colour: NAVY });
    if (i < contact.length - 1) {
      x -= 6;
      draw(page, '·', x, baseline, fonts, { size: 6.8, colour: SLATE });
      x -= 4;
    }
  });

  // The standing terms. A receipt asserts it is proof of payment; an invoice
  // that has not been paid must not, so the last clause changes with the
  // document rather than being printed regardless.
  const proof =
    doc.docType === 'receipt'
      ? 'This receipt is valid proof of payment'
      : 'This invoice is a request for payment and is not a receipt';
  page.drawRectangle({
    x: FRAME + 1,
    y: FRAME + 5,
    width: PAGE_W - FRAME * 2 - 2,
    height: 11,
    color: MIST,
  });
  drawCentre(
    page,
    `All amounts in Kenyan Shillings (KES) · Goods remain the property of Oriel Power Ltd until paid in full · ${proof}`,
    PAGE_W / 2,
    FRAME + 8.5,
    fonts,
    { size: 5.4, colour: SLATE }
  );
}

/** One copy, complete, on its own half-A4 page. */
async function drawCopy(
  pdf: PDFDocument,
  page: PDFPage,
  fonts: Fonts,
  doc: DocumentRecord,
  copy: CopyKind
) {
  drawFrame(page);
  drawSunRays(page);

  let y = await drawHeader(pdf, page, fonts, copy);
  y = drawTitleBar(page, fonts, y, doc);
  y = drawGoodsRow(page, fonts, y, doc);
  y = drawCustomerRow(page, fonts, y, doc);
  y = drawItemsTable(page, fonts, y, doc);

  drawPaymentMethod(page, fonts, y - 2, doc);
  drawSummary(page, fonts, y - 2, doc);
  drawSignatures(page, fonts, SIGNATURE_RULE_Y);
  drawFooter(page, fonts, doc);

  // A voided document must never be mistaken for a live one, and staff do
  // reprint from the list. Diagonal, large, and behind nothing.
  if (doc.status === 'void') {
    page.drawText('VOID', {
      x: PAGE_W / 2 - 150,
      y: PAGE_H / 2 - 40,
      size: 96,
      font: fonts.bold,
      color: ORANGE,
      opacity: 0.16,
      rotate: degrees(18),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export type RenderMode = CopyKind | 'both';

/**
 * Render a document to PDF bytes.
 *
 * 'original'  — the customer's copy alone. What gets emailed and WhatsApped.
 * 'duplicate' — the office copy alone.
 * 'both'      — one A4 sheet, original above, duplicate below, tear line
 *               between. What the counter prints and what the pad does.
 */
export async function renderDocumentPdf(
  doc: DocumentRecord,
  mode: RenderMode = 'original'
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    oblique: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };

  pdf.setTitle(
    `${doc.docType === 'receipt' ? 'Receipt' : 'Invoice'} ${doc.docNumber ?? 'draft'} — Oriel Power Ltd`
  );
  pdf.setAuthor('Oriel Power Ltd');
  pdf.setCreator('Oriel Power Ltd — orielpower.com');
  pdf.setSubject(`${doc.customerName} · KES ${formatAmount(doc.total)}`);

  if (mode !== 'both') {
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    await drawCopy(pdf, page, fonts, doc, mode);
    return pdf.save();
  }

  // Both copies on one A4 sheet, original above the fold.
  //
  // Each copy is drawn straight onto the sheet with the coordinate system
  // shifted up by half a page, rather than rendered as a separate document and
  // stamped in. Stamping worked, but embedding pages across two PDFDocument
  // instances left dangling object references — Ghostscript and MuPDF both
  // reported "cannot find object in xref" on the result, and a receipt that
  // makes the customer's PDF reader complain is not something to ship.
  // Translating the graphics state produces one clean content stream and keeps
  // a single description of the layout.
  const sheet = pdf.addPage([PAGE_W, PAGE_H * 2]);

  sheet.pushOperators(pushGraphicsState(), translate(0, PAGE_H));
  await drawCopy(pdf, sheet, fonts, doc, 'original');
  sheet.pushOperators(popGraphicsState());

  await drawCopy(pdf, sheet, fonts, doc, 'duplicate');

  // The tear line, printed across the fold.
  const tearY = PAGE_H;
  sheet.drawLine({
    start: { x: 24, y: tearY },
    end: { x: PAGE_W - 24, y: tearY },
    thickness: 0.6,
    color: SLATE,
    dashArray: [3, 2.4],
    opacity: 0.6,
  });
  // No scissors glyph: the standard fonts are WinAnsi-encoded and U+2702 is not
  // in that set, so pdf-lib would refuse to encode it and the whole render
  // would fail rather than degrade.
  const tearLabel = 'TEAR HERE — RETAIN LOWER COPY FOR OFFICE RECORDS';
  const labelW = widthOf(tearLabel, fonts.regular, 5.6, 0.9);
  // Punch a gap in the dashes so the label sits on white rather than on the rule.
  sheet.drawRectangle({
    x: PAGE_W / 2 - labelW / 2 - 8,
    y: tearY - 4,
    width: labelW + 16,
    height: 8,
    color: WHITE,
  });
  draw(sheet, tearLabel, PAGE_W / 2 - labelW / 2, tearY - 2, fonts, {
    size: 5.6,
    colour: SLATE,
    tracking: 0.9,
  });

  return pdf.save();
}

/** The filename a customer sees in their inbox or on their phone. */
export function documentFilename(doc: DocumentRecord, mode: RenderMode = 'original'): string {
  const kind = doc.docType === 'receipt' ? 'Receipt' : 'Invoice';
  const who = doc.customerName
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join('-');
  const suffix = mode === 'both' ? 'BOTH-COPIES' : mode.toUpperCase();
  return `Oriel-Power-${kind}-${doc.docNumber ?? 'DRAFT'}${who ? `-${who}` : ''}-${suffix}.pdf`;
}
