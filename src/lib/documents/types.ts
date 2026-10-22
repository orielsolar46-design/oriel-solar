/**
 * The invoice / receipt model.
 *
 * This file is the single description of what a document IS, shared by the PDF
 * renderer, the admin form, the API routes and the email templates. It is
 * deliberately free of `server-only` so the admin form can import the types and
 * the arithmetic and show the customer's own totals as they type — the same
 * function that the server will use, so the preview cannot disagree with the
 * document that gets issued.
 *
 * The shape follows the client's printed pad exactly. Anything on the paper is
 * here; nothing that is not on the paper has been added.
 */

export type DocumentType = 'invoice' | 'receipt';

export type DocumentStatus = 'draft' | 'issued' | 'part_paid' | 'paid' | 'void';

export type DocumentSource = 'order' | 'walk_in';

export type PaymentMethod = 'cash' | 'mpesa' | 'bank_transfer' | 'cheque';

/**
 * exclusive — line amounts are net and VAT is added on top. This is how the
 *             paper pad is filled in and how a supplier invoice reads.
 * inclusive — line amounts already contain VAT, which is backed out to show
 *             the split. Every price on the website is VAT-inclusive retail,
 *             so every document generated from an order uses this.
 * none      — no VAT line is printed at all.
 */
export type VatMode = 'exclusive' | 'inclusive' | 'none';

export type DocumentLine = {
  description: string;
  quantity: number;
  /**
   * Null prints as an em dash. The pad uses that for a line like
   * "Installation (Materials & Labour)", where a unit price is meaningless.
   */
  unitPrice: number | null;
  /**
   * What is actually charged for the line. Stored, not derived: the pad allows
   * a negotiated total that is not quantity x unit price, and the sample the
   * client sent does exactly that — a heat pump listed at 199,940 and charged
   * at 180,940. Deriving this would quietly delete the discount.
   */
  amount: number;
};

export type DocumentRecord = {
  id: string;
  docType: DocumentType;
  /** Null while still a draft — numbers are allocated at issue, not before. */
  docNumber: string | null;
  status: DocumentStatus;
  source: DocumentSource;
  orderId: string | null;
  orderNumber: string | null;
  accessToken: string;

  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  kraPin: string | null;

  goodsCategories: string[];
  lines: DocumentLine[];

  vatMode: VatMode;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  amountPaid: number;
  balance: number;

  paymentMethod: PaymentMethod | null;
  mpesaTill: string | null;
  mpesaCode: string | null;
  bankRef: string | null;

  receivedBy: string | null;
  notes: string | null;
  dueDate: string | null;

  issuedAt: string | null;
  lastSentAt: string | null;
  lastSentTo: string | null;
  createdAt: string;
};

/* -------------------------------------------------------------------------- */
/* The tick-box row                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The eight boxes printed across the top of the pad, in the printed order.
 * These are the client's own headings and are not ours to extend — a document
 * whose goods fall outside all eight simply ticks nothing, which is what the
 * paper does too. `catalogue` maps a shop category onto the box it belongs in
 * so that documents generated from an order tick themselves.
 *
 * `water-treatment` is deliberately absent: the pad has no box for it. Its
 * products still appear by name on their description line.
 */
export const GOODS_CATEGORIES: {
  id: string;
  label: string;
  catalogue: string | null;
}[] = [
  { id: 'solar_panels', label: 'Solar Panels', catalogue: 'solar-panels' },
  { id: 'batteries', label: 'Batteries', catalogue: 'battery-storage' },
  { id: 'inverters', label: 'Inverters', catalogue: 'inverters' },
  { id: 'water_heaters', label: 'Water Heaters', catalogue: 'solar-water-heaters' },
  { id: 'street_lights', label: 'Street Lights', catalogue: 'lighting' },
  { id: 'irrigation_pumps', label: 'Irrigation Pumps', catalogue: 'irrigation-pumps' },
  { id: 'installation', label: 'Installation / Labour', catalogue: null },
  { id: 'delivery', label: 'Delivery', catalogue: null },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'cheque', label: 'Cheque' },
];

export function paymentMethodLabel(method: PaymentMethod | null): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.label ?? 'Not recorded';
}

/* -------------------------------------------------------------------------- */
/* Money                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Round to whole cents. Every figure that reaches the database or the PDF goes
 * through this. Money in JavaScript is a float, so 0.1 + 0.2 is famously not
 * 0.3; on a receipt that surfaces as a balance of "-0.00" on an order that was
 * paid in full, which makes a customer ring up. Rounding at every boundary
 * keeps the printed arithmetic exact.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type DocumentTotals = {
  subtotal: number;
  vatAmount: number;
  total: number;
  balance: number;
};

/**
 * Derive the summary box from the lines. Used by the server on every write and
 * by the admin form on every keystroke — never two implementations.
 *
 * The VAT split is computed from the total, not accumulated line by line.
 * Sixteen per cent of each of five lines, each rounded, does not reliably add
 * up to sixteen per cent of their sum, and a receipt whose VAT column is a
 * shilling out from the tax the company actually remits is a receipt that
 * causes an argument with KRA.
 */
export function computeTotals(
  lines: DocumentLine[],
  vatMode: VatMode,
  vatRate: number,
  amountPaid: number
): DocumentTotals {
  const gross = round2(lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0));
  const rate = Number(vatRate) || 0;

  let subtotal: number;
  let vatAmount: number;
  let total: number;

  if (vatMode === 'exclusive' && rate > 0) {
    subtotal = gross;
    vatAmount = round2(gross * (rate / 100));
    total = round2(subtotal + vatAmount);
  } else if (vatMode === 'inclusive' && rate > 0) {
    total = gross;
    subtotal = round2(gross / (1 + rate / 100));
    // The remainder, not a second percentage calculation, so the three figures
    // always reconcile: subtotal + VAT is the total, to the cent.
    vatAmount = round2(total - subtotal);
  } else {
    subtotal = gross;
    vatAmount = 0;
    total = gross;
  }

  return {
    subtotal,
    vatAmount,
    total,
    balance: round2(total - (Number(amountPaid) || 0)),
  };
}

/** The status a document should carry given what has been paid against it. */
export function statusForPayment(total: number, amountPaid: number): DocumentStatus {
  if (amountPaid <= 0) return 'issued';
  // A rounding cent either way still counts as settled — see round2 above.
  if (round2(total - amountPaid) <= 0.009) return 'paid';
  return 'part_paid';
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Two decimal places with thousands separators — "242,440.00".
 *
 * The pad prints money this way and so does the PDF. Note this differs from
 * the storefront's `formatKes`, which drops the decimals and prefixes "KES":
 * on a shop shelf "KES 242,440" is easier to read, but on a financial document
 * the cents are part of the record and the currency is stated once in the
 * column heading instead of repeated on every row.
 */
export function formatAmount(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Date as it is written on the pad: 07/08/2026. */
export function formatDocumentDate(iso: string | null | undefined): string {
  const date = iso ? new Date(iso) : new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()}`;
}

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: 'Draft',
  issued: 'Issued',
  part_paid: 'Part paid',
  paid: 'Paid',
  void: 'Void',
};
