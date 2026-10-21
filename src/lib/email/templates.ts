import { absoluteUrl } from '@/lib/site';
import {
  formatAmount,
  formatDocumentDate,
  paymentMethodLabel,
  type DocumentRecord,
} from '@/lib/documents/types';
import type { OrderRecord, OrderStatus } from '@/lib/orders/store';

/**
 * Every email the shop sends.
 *
 * Written as tables with inline styles, which looks like 2003 and is the only
 * thing that survives Gmail, Outlook and the stock Android client at once —
 * Outlook still renders with Word's engine, which has never supported flexbox,
 * grid, or a stylesheet in the head. The brand colours and the sun-arc rule
 * under the header carry the identity; nothing depends on CSS that might be
 * stripped.
 *
 * Every message also carries a plain-text alternative. It is not a formality:
 * a customer on a feature phone or a metered connection reads that version,
 * and so does every spam filter deciding whether this is a real message.
 */

const NAVY = '#0B2A6B';
const NAVY_INK = '#0A1733';
const ORANGE = '#F26A21';
const GOLD = '#FDB913';
const GREEN = '#3FA535';
const GREEN_DEEP = '#2E7D28';
const MIST = '#F4F6FB';
const LINE = '#DCE3F0';
const SLATE = '#5A6784';

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif";

export type Email = { subject: string; html: string; text: string };

function kes(value: number): string {
  return `KES ${formatAmount(value)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* -------------------------------------------------------------------------- */
/* Building blocks                                                             */
/* -------------------------------------------------------------------------- */

type Block = string;

/**
 * The shell every message sits in: a navy header carrying the company name, a
 * gold-to-orange rule beneath it standing in for the sun arc, the body on
 * white, and a footer with the ways to reach a human.
 */
function shell(options: {
  preheader: string;
  heading: string;
  /** A short line under the heading, in the tone of the message. */
  strapline?: string;
  tone?: 'navy' | 'green' | 'orange';
  body: Block[];
}): string {
  const accent =
    options.tone === 'green' ? GREEN_DEEP : options.tone === 'orange' ? ORANGE : NAVY;

  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${MIST};">
<!-- The preheader is what a phone shows next to the subject in the inbox list.
     Hidden in the message itself, and followed by padding characters so the
     client does not pull the first line of the body up beside it. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    options.preheader
  )}&#8199;&#65279;&nbsp;${'&#847; &zwnj; &nbsp; &#8199; &shy; '.repeat(12)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${MIST};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${LINE};border-radius:14px;overflow:hidden;">

  <tr><td style="background:${NAVY};padding:22px 28px;">
    <div style="font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">Oriel Power Ltd</div>
    <div style="font-family:${FONT};font-size:10px;font-weight:600;color:${GOLD};letter-spacing:1.6px;text-transform:uppercase;padding-top:4px;">Solar supply · Installation · Maintenance</div>
  </td></tr>
  <tr><td style="font-size:0;line-height:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td height="3" style="background:${GOLD};font-size:0;line-height:0;">&nbsp;</td>
      <td height="3" style="background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:28px;">
    <h1 style="margin:0;font-family:${FONT};font-size:22px;line-height:1.25;font-weight:700;color:${accent};">${escapeHtml(
      options.heading
    )}</h1>
    ${
      options.strapline
        ? `<p style="margin:8px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:${SLATE};">${options.strapline}</p>`
        : ''
    }
    ${options.body.join('\n')}
  </td></tr>

  <tr><td style="background:${MIST};border-top:1px solid ${LINE};padding:20px 28px;">
    <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${NAVY_INK};">
      <strong style="color:${NAVY};">Questions?</strong> Ring or WhatsApp
      <a href="tel:+254723204342" style="color:${ORANGE};text-decoration:none;font-weight:600;">0723&nbsp;204&nbsp;342</a>
      or reply to this email.
    </p>
    <p style="margin:10px 0 0;font-family:${FONT};font-size:11px;line-height:1.6;color:${SLATE};">
      Oriel Power Ltd · Nairobi, Kenya · <a href="${absoluteUrl('/')}" style="color:${SLATE};">orielpower.com</a><br>
      Clean energy, more savings, brighter tomorrow.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function paragraph(html: string): Block {
  return `<p style="margin:16px 0 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${NAVY_INK};">${html}</p>`;
}

/** A bordered panel for something the reader must not skim past. */
function panel(html: string, tone: 'navy' | 'green' | 'gold' = 'navy'): Block {
  const border = tone === 'green' ? GREEN : tone === 'gold' ? GOLD : NAVY;
  const background = tone === 'green' ? '#EAF6E8' : tone === 'gold' ? '#FFF6E0' : MIST;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
    <tr><td style="background:${background};border-left:4px solid ${border};border-radius:0 8px 8px 0;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${NAVY_INK};">${html}</td></tr>
  </table>`;
}

function button(label: string, href: string): Block {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
    <tr><td style="background:${ORANGE};border-radius:999px;">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(
        label
      )}</a>
    </td></tr>
  </table>`;
}

/** The itemised table. The same shape in every message that shows money. */
function itemsTable(
  rows: { description: string; quantity: number; amount: number }[],
  totals: { label: string; value: string; emphasis?: boolean }[]
): Block {
  const body = rows
    .map(
      (row) => `<tr>
        <td style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:14px;color:${NAVY_INK};">
          ${escapeHtml(row.description)}
          <span style="color:${SLATE};font-size:12px;">&nbsp;×&nbsp;${row.quantity}</span>
        </td>
        <td align="right" style="padding:9px 0;border-bottom:1px solid ${LINE};font-family:${FONT};font-size:14px;color:${NAVY_INK};white-space:nowrap;">${formatAmount(
          row.amount
        )}</td>
      </tr>`
    )
    .join('');

  const summary = totals
    .map(
      (total) => `<tr>
        <td style="padding:${total.emphasis ? '12px 0 0' : '7px 0 0'};font-family:${FONT};font-size:${
          total.emphasis ? '16px' : '13px'
        };font-weight:${total.emphasis ? '700' : '400'};color:${
          total.emphasis ? NAVY : SLATE
        };">${escapeHtml(total.label)}</td>
        <td align="right" style="padding:${
          total.emphasis ? '12px 0 0' : '7px 0 0'
        };font-family:${FONT};font-size:${total.emphasis ? '16px' : '13px'};font-weight:${
          total.emphasis ? '700' : '400'
        };color:${total.emphasis ? NAVY : SLATE};white-space:nowrap;">${escapeHtml(
          total.value
        )}</td>
      </tr>`
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
    <tr>
      <td style="padding:0 0 8px;border-bottom:2px solid ${NAVY};font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${NAVY};">Item</td>
      <td align="right" style="padding:0 0 8px;border-bottom:2px solid ${NAVY};font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${NAVY};">KES</td>
    </tr>
    ${body}
    ${summary}
  </table>`;
}

/** Two-column facts. Used for reference numbers and payment details. */
function factList(facts: [string, string][]): Block {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border:1px solid ${LINE};border-radius:8px;">
    ${facts
      .map(
        ([label, value], i) => `<tr>
          <td style="padding:10px 14px;${
            i ? `border-top:1px solid ${LINE};` : ''
          }font-family:${FONT};font-size:13px;color:${SLATE};">${escapeHtml(label)}</td>
          <td align="right" style="padding:10px 14px;${
            i ? `border-top:1px solid ${LINE};` : ''
          }font-family:${FONT};font-size:13px;font-weight:600;color:${NAVY_INK};">${escapeHtml(
            value
          )}</td>
        </tr>`
      )
      .join('')}
  </table>`;
}

function attachmentNote(kind: 'invoice' | 'receipt'): Block {
  return `<p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${SLATE};">
    Your ${kind} is attached to this email as a PDF. Keep it — it is your record of ${
      kind === 'receipt' ? 'payment' : 'this order'
    }.
  </p>`;
}

/* -------------------------------------------------------------------------- */
/* Order lifecycle                                                             */
/* -------------------------------------------------------------------------- */

function orderUrl(order: OrderRecord): string {
  return absoluteUrl(`/order/${order.orderNumber}?token=${order.accessToken}`);
}

function orderRows(order: OrderRecord) {
  return order.lines.map((line) => ({
    description: line.productName,
    quantity: line.quantity,
    amount: line.unitPrice * line.quantity,
  }));
}

function deliveryLine(order: OrderRecord): string {
  if (order.deliveryMethod === 'collection') return 'Collection from our premises — free';
  if (order.deliveryFee != null) return kes(order.deliveryFee);
  return 'Quoted per order and confirmed before dispatch';
}

/** Sent the moment an order is placed. Carries the invoice PDF. */
export function orderPlacedEmail(order: OrderRecord): Email {
  const payNow = order.paymentOption === 'pay_now';

  return {
    subject: `Order ${order.orderNumber} ${payNow ? 'received' : 'confirmed'} — Oriel Power Ltd`,
    text: [
      `Hello ${order.customerName},`,
      '',
      payNow
        ? `Your order ${order.orderNumber} has been received. The total is ${kes(order.total)}, including 16% VAT.`
        : `Your order ${order.orderNumber} is confirmed. The total is ${kes(order.total)}, including 16% VAT.`,
      '',
      payNow
        ? 'We have sent an M-Pesa request to your phone. Enter your M-Pesa PIN to approve it.'
        : 'You chose to pay on delivery. When the goods are with you our team sends the M-Pesa request to your phone and you approve it at handover. Payment is by M-Pesa - no cash is needed or carried.',
      '',
      'What you ordered:',
      ...order.lines.map(
        (line) => `  ${line.quantity} x ${line.productName} - ${kes(line.unitPrice * line.quantity)}`
      ),
      `  Delivery: ${deliveryLine(order)}`,
      `  Total: ${kes(order.total)} (incl. 16% VAT)`,
      '',
      'Your invoice is attached as a PDF.',
      '',
      `Track your order: ${orderUrl(order)}`,
      '',
      'Oriel Power Ltd - Clean energy, more savings, brighter tomorrow',
      '0723 204 342 - info@orielpower.com',
    ].join('\n'),
    html: shell({
      preheader: `${order.orderNumber} · ${kes(order.total)} · your invoice is attached`,
      heading: payNow ? 'We have your order' : 'Your order is confirmed',
      strapline: `Thank you, ${escapeHtml(order.customerName)}. Here is everything you ordered.`,
      body: [
        factList([
          ['Order number', order.orderNumber],
          ['Placed', formatDocumentDate(order.createdAt)],
          [
            'Delivery',
            order.deliveryMethod === 'collection'
              ? 'Collection from our premises'
              : [order.town, order.county].filter(Boolean).join(', ') || 'To be confirmed',
          ],
        ]),
        itemsTable(orderRows(order), [
          { label: 'Delivery', value: deliveryLine(order) },
          { label: 'Total (incl. 16% VAT)', value: kes(order.total), emphasis: true },
        ]),
        payNow
          ? panel(
              `<strong>Approve the M-Pesa request on your phone.</strong> We have sent it to ${escapeHtml(
                order.phone
              )}. Enter your M-Pesa PIN to complete the payment. If the prompt did not arrive, open your order below and ask for it again.`,
              'gold'
            )
          : panel(
              `<strong>You are paying on delivery, by M-Pesa.</strong> When the goods reach you, our team sends the M-Pesa request to ${escapeHtml(
                order.phone
              )} and you approve it at handover. No cash is needed and none is carried — please do not hand cash to anyone.`,
              'gold'
            ),
        attachmentNote('invoice'),
        button('Track your order', orderUrl(order)),
      ],
    }),
  };
}

/** Sent when money has actually landed. Carries the receipt PDF. */
export function paymentReceivedEmail(
  order: OrderRecord,
  payment: { amount: number; mpesaReceipt?: string | null }
): Email {
  const short = payment.amount < order.total;

  return {
    subject: `Payment received for order ${order.orderNumber} — Oriel Power Ltd`,
    text: [
      `Hello ${order.customerName},`,
      '',
      `We have received your payment of ${kes(payment.amount)} for order ${order.orderNumber}.`,
      payment.mpesaReceipt ? `M-Pesa transaction code: ${payment.mpesaReceipt}` : '',
      'Paid by: M-Pesa',
      short
        ? `Balance outstanding: ${kes(order.total - payment.amount)}`
        : 'Your order is paid in full.',
      '',
      'Your receipt is attached as a PDF. It is your proof of payment.',
      '',
      `Track your order: ${orderUrl(order)}`,
      '',
      'Asante sana - powering a cleaner future, one roof at a time.',
      'Oriel Power Ltd - 0723 204 342 - info@orielpower.com',
    ]
      .filter(Boolean)
      .join('\n'),
    html: shell({
      preheader: `${kes(payment.amount)} received · receipt attached`,
      heading: 'Payment received',
      strapline: `Thank you, ${escapeHtml(order.customerName)}. ${
        short ? 'Here is your receipt for the amount paid.' : 'Your order is paid in full.'
      }`,
      tone: 'green',
      body: [
        factList(
          [
            ['Order number', order.orderNumber],
            ['Amount paid', kes(payment.amount)],
            ['Payment method', 'M-Pesa'],
            ...(payment.mpesaReceipt
              ? ([['M-Pesa transaction code', payment.mpesaReceipt]] as [string, string][])
              : []),
            ['Paid on', formatDocumentDate(new Date().toISOString())],
            ...(short
              ? ([['Balance outstanding', kes(order.total - payment.amount)]] as [string, string][])
              : []),
          ].filter(Boolean) as [string, string][]
        ),
        itemsTable(orderRows(order), [
          { label: 'Order total (incl. 16% VAT)', value: kes(order.total) },
          { label: 'Paid', value: kes(payment.amount), emphasis: true },
        ]),
        attachmentNote('receipt'),
        button('View your order', orderUrl(order)),
      ],
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Status changes                                                              */
/* -------------------------------------------------------------------------- */

type StatusCopy = {
  subject: string;
  heading: string;
  strapline: string;
  detail: string;
  tone?: 'navy' | 'green' | 'orange';
  /** Shown in the panel. Omitted where there is nothing worth pointing at. */
  note?: (order: OrderRecord) => string | null;
};

/**
 * What the customer is told at each step.
 *
 * Only the statuses a customer should hear about are here. `pending_payment`
 * and `pending_cod` are the states an order is created in and are covered by
 * the order confirmation; `paid` is covered by the payment receipt, which
 * carries the PDF and is a better message than a bare status change would be.
 * Anything absent from this map sends nothing at all, which is deliberate —
 * silence beats a meaningless email.
 */
const STATUS_COPY: Partial<Record<OrderStatus, StatusCopy>> = {
  processing: {
    subject: 'We are preparing your order',
    heading: 'Your order is being prepared',
    strapline: 'We are picking and checking your items now.',
    detail:
      'Every item is checked before it leaves us. We will email you again the moment your order is on its way.',
  },
  out_for_delivery: {
    subject: 'Your order is on its way',
    heading: 'Your order is on its way',
    strapline: 'Our team has left with your order.',
    tone: 'orange',
    detail:
      'Please keep your phone nearby — the team will ring when they are close so someone can receive the goods.',
    note: (order) =>
      order.paymentOption === 'pay_on_delivery'
        ? `<strong>Have your M-Pesa ready.</strong> At handover we send an M-Pesa request for ${kes(
            order.total
          )} to ${escapeHtml(
            order.phone
          )} and you approve it with your PIN. Please do not hand cash to anyone — we never collect it.`
        : null,
  },
  delivered: {
    subject: 'Your order has been delivered',
    heading: 'Delivered — thank you',
    strapline: 'Your order has been handed over.',
    tone: 'green',
    detail:
      'Please check everything over. If anything is missing or not right, ring us on 0723 204 342 straight away and we will put it right.',
    note: () =>
      'Keep your receipt safe. You will need it for any warranty claim, along with the serial numbers on the equipment.',
  },
  cancelled: {
    subject: 'Your order has been cancelled',
    heading: 'Your order has been cancelled',
    strapline: 'This order will not be delivered.',
    tone: 'orange',
    detail:
      'If you did not ask for this, or you would like to place the order again, ring us on 0723 204 342 and we will sort it out.',
    note: () =>
      'If you had already paid, your refund is being processed and you will get a separate email confirming it.',
  },
  refunded: {
    subject: 'Your refund has been processed',
    heading: 'Your refund has been processed',
    strapline: 'The money is on its way back to you.',
    tone: 'green',
    detail:
      'Refunds are returned to the M-Pesa number that paid. It can take a short while to appear, depending on Safaricom.',
  },
  payment_failed: {
    subject: 'Your payment did not go through',
    heading: 'Your payment did not go through',
    strapline: 'Nothing has been taken from your M-Pesa.',
    tone: 'orange',
    detail:
      'This usually means the prompt timed out or was declined. Nothing has been charged. Open your order below to try again, or ring us and we will send a fresh request.',
  },
};

export function orderStatusEmail(order: OrderRecord, status: OrderStatus): Email | null {
  const copy = STATUS_COPY[status];
  if (!copy) return null;

  const note = copy.note?.(order) ?? null;

  return {
    subject: `${copy.subject} — order ${order.orderNumber}`,
    text: [
      `Hello ${order.customerName},`,
      '',
      `${copy.strapline} (Order ${order.orderNumber}, ${kes(order.total)}.)`,
      '',
      copy.detail,
      '',
      note ? `${note.replace(/<[^>]+>/g, '')}\n` : '',
      `Track your order: ${orderUrl(order)}`,
      '',
      'Oriel Power Ltd - 0723 204 342 - info@orielpower.com',
    ]
      .filter((line) => line !== '')
      .join('\n'),
    html: shell({
      preheader: `${copy.strapline} Order ${order.orderNumber}.`,
      heading: copy.heading,
      strapline: escapeHtml(copy.strapline),
      tone: copy.tone,
      body: [
        factList([
          ['Order number', order.orderNumber],
          ['Order total', kes(order.total)],
          [
            'Delivery',
            order.deliveryMethod === 'collection'
              ? 'Collection from our premises'
              : [order.town, order.county].filter(Boolean).join(', ') || 'To be confirmed',
          ],
        ]),
        paragraph(copy.detail),
        ...(note ? [panel(note, status === 'delivered' ? 'green' : 'gold')] : []),
        button('Track your order', orderUrl(order)),
      ],
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Documents raised by hand                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The message that goes with an invoice or receipt written in the back office
 * — the counter sale, the site visit, the customer who rang up and ordered
 * over the phone. `note` is whatever the clerk typed in the send box; when
 * they type nothing, the standard wording stands on its own.
 */
export function documentEmail(doc: DocumentRecord, note?: string | null): Email {
  const isReceipt = doc.docType === 'receipt';
  const owing = doc.balance > 0;
  const publicUrl = absoluteUrl(`/document/${doc.docNumber}?token=${doc.accessToken}`);

  const facts: [string, string][] = [
    [isReceipt ? 'Receipt number' : 'Invoice number', doc.docNumber ?? 'Draft'],
    ['Date', formatDocumentDate(doc.issuedAt ?? doc.createdAt)],
    ['Total', kes(doc.total)],
  ];
  if (doc.amountPaid > 0) facts.push(['Amount paid', kes(doc.amountPaid)]);
  if (owing) facts.push(['Balance outstanding', kes(doc.balance)]);
  if (doc.paymentMethod) facts.push(['Payment method', paymentMethodLabel(doc.paymentMethod)]);
  if (doc.mpesaCode) facts.push(['M-Pesa code', doc.mpesaCode]);
  if (doc.bankRef) facts.push(['Bank / cheque reference', doc.bankRef]);
  if (doc.dueDate) facts.push(['Payment due by', formatDocumentDate(doc.dueDate)]);

  const heading = isReceipt
    ? owing
      ? 'Your receipt — part payment'
      : 'Your receipt'
    : 'Your invoice';

  return {
    subject: `${isReceipt ? 'Receipt' : 'Invoice'} ${doc.docNumber ?? ''} — Oriel Power Ltd`.replace(
      /\s+—/,
      ' —'
    ),
    text: [
      `Hello ${doc.customerName},`,
      '',
      note?.trim() ? `${note.trim()}\n` : '',
      isReceipt
        ? `Thank you. Please find your receipt for ${kes(doc.amountPaid)} attached as a PDF.`
        : `Please find your invoice for ${kes(doc.total)} attached as a PDF.`,
      owing ? `Balance outstanding: ${kes(doc.balance)}.` : '',
      '',
      ...facts.map(([label, value]) => `${label}: ${value}`),
      '',
      'What it covers:',
      ...doc.lines.map(
        (line) => `  ${line.quantity} x ${line.description} - ${formatAmount(line.amount)}`
      ),
      '',
      `A copy is also available here: ${publicUrl}`,
      '',
      'Asante sana - powering a cleaner future, one roof at a time.',
      'Oriel Power Ltd - 0723 204 342 - info@orielpower.com',
    ]
      .filter((line) => line !== '')
      .join('\n'),
    html: shell({
      preheader: `${isReceipt ? 'Receipt' : 'Invoice'} ${doc.docNumber ?? ''} · ${kes(doc.total)}`,
      heading,
      strapline: isReceipt
        ? `Thank you, ${escapeHtml(doc.customerName)}. Your ${
            owing ? 'part ' : ''
          }payment has been received.`
        : `Hello ${escapeHtml(doc.customerName)}. Here is your invoice.`,
      tone: isReceipt && !owing ? 'green' : 'navy',
      body: [
        ...(note?.trim() ? [paragraph(escapeHtml(note.trim()).replace(/\n/g, '<br>'))] : []),
        factList(facts),
        itemsTable(
          doc.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            amount: line.amount,
          })),
          [
            { label: 'Subtotal', value: kes(doc.subtotal) },
            ...(doc.vatMode === 'none'
              ? []
              : [{ label: `VAT @ ${doc.vatRate}%`, value: kes(doc.vatAmount) }]),
            { label: 'Total', value: kes(doc.total), emphasis: true },
            ...(doc.amountPaid > 0
              ? [{ label: 'Amount paid', value: kes(doc.amountPaid) }]
              : []),
            ...(owing ? [{ label: 'Balance due', value: kes(doc.balance) }] : []),
          ]
        ),
        owing
          ? panel(
              `<strong>Balance outstanding: ${kes(
                doc.balance
              )}.</strong> Pay by M-Pesa on our till, by bank transfer, or at our premises. Ring 0723 204 342 if you need the payment details again.`,
              'gold'
            )
          : attachmentNote(isReceipt ? 'receipt' : 'invoice'),
        button(`View your ${isReceipt ? 'receipt' : 'invoice'}`, publicUrl),
      ],
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Staff copy                                                                  */
/* -------------------------------------------------------------------------- */

/** The shop's own copy of a new order. Plain, dense, and built to be scanned. */
export function staffOrderEmail(order: OrderRecord): Email {
  const payNow = order.paymentOption === 'pay_now';
  const lines = order.lines.map(
    (line) =>
      `  ${line.quantity} x ${line.productName} (${line.modelCode ?? '-'}) - ${kes(
        line.unitPrice * line.quantity
      )}`
  );

  return {
    subject: `New order ${order.orderNumber} — ${kes(order.total)} (${payNow ? 'pay now' : 'COD'})`,
    text: [
      `Order ${order.orderNumber}`,
      `Customer: ${order.customerName} - ${order.phone}${order.email ? ` - ${order.email}` : ''}`,
      `Delivery: ${
        order.deliveryMethod === 'collection'
          ? 'collection'
          : `${order.county}${order.town ? `, ${order.town}` : ''}`
      }`,
      `Payment: ${payNow ? 'M-Pesa pay now' : 'M-Pesa on delivery'}`,
      `Installation requested: ${order.installationRequested ? 'yes' : 'no'}`,
      '',
      ...lines,
      `Total: ${kes(order.total)}`,
      '',
      `Open in the back office: ${absoluteUrl(`/admin/orders/${order.orderNumber}`)}`,
    ].join('\n'),
    html: shell({
      preheader: `${order.customerName} · ${kes(order.total)} · ${payNow ? 'pay now' : 'COD'}`,
      heading: `New order ${order.orderNumber}`,
      strapline: `${escapeHtml(order.customerName)} · ${escapeHtml(order.phone)}`,
      tone: 'orange',
      body: [
        factList([
          ['Customer', order.customerName],
          ['Phone', order.phone],
          ...(order.email ? ([['Email', order.email]] as [string, string][]) : []),
          [
            'Delivery',
            order.deliveryMethod === 'collection'
              ? 'Collection'
              : [order.town, order.county].filter(Boolean).join(', '),
          ],
          ['Payment', payNow ? 'M-Pesa pay now' : 'M-Pesa on delivery'],
          ['Installation', order.installationRequested ? 'Requested' : 'No'],
        ]),
        itemsTable(orderRows(order), [
          { label: 'Total', value: kes(order.total), emphasis: true },
        ]),
        button('Open in the back office', absoluteUrl(`/admin/orders/${order.orderNumber}`)),
      ],
    }),
  };
}
