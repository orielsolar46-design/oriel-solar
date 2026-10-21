import 'server-only';
import { getProductsBySlugs } from '@/lib/catalogue';
import { GOODS_CATEGORIES, type DocumentLine } from '@/lib/documents/types';
import type { DocumentInput } from '@/lib/documents/store';
import type { OrderRecord } from '@/lib/orders/store';

/**
 * Turn a web order into an invoice or a receipt.
 *
 * The one subtlety worth stating plainly: every price in this catalogue is
 * VAT-INCLUSIVE retail, and the pad the client fills in by hand is written
 * VAT-EXCLUSIVE with the tax added underneath. Both are correct, and the
 * document handles the difference by carrying its VAT mode rather than by
 * converting the figures.
 *
 * So a document raised from an order says `inclusive`: the line amounts are
 * what the customer actually agreed to pay, the summary backs the VAT out of
 * them, and TOTAL DUE equals the order total to the cent. If the amounts were
 * converted to net instead, the printed line prices would no longer match the
 * prices on the website and the customer's first act would be to ring up and
 * ask why they had been overcharged.
 */

/** Map the ordered products onto the tick boxes across the top of the form. */
async function goodsCategoriesFor(order: OrderRecord): Promise<string[]> {
  const ticked = new Set<string>();

  const products = await getProductsBySlugs(order.lines.map((l) => l.slug));
  const byCategory = new Map(
    GOODS_CATEGORIES.filter((c) => c.catalogue).map((c) => [c.catalogue as string, c.id])
  );
  for (const product of products) {
    const box = byCategory.get(product.category);
    if (box) ticked.add(box);
  }

  // Only ticked when something is actually charged for it on this document.
  // Installation on this site is quoted per job after a survey and is not on
  // the order total, so requesting it does not tick the box — a receipt should
  // describe what was paid for, not what was discussed.
  if (order.deliveryFee != null && order.deliveryFee > 0) ticked.add('delivery');

  return Array.from(ticked);
}

function linesFor(order: OrderRecord): DocumentLine[] {
  const lines: DocumentLine[] = order.lines.map((line) => ({
    description: line.modelCode ? `${line.productName} (${line.modelCode})` : line.productName,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    amount: line.unitPrice * line.quantity,
  }));

  if (order.deliveryFee != null && order.deliveryFee > 0) {
    lines.push({
      description:
        order.deliveryMethod === 'collection'
          ? 'Collection'
          : `Delivery — ${[order.town, order.county].filter(Boolean).join(', ')}`,
      quantity: 1,
      unitPrice: order.deliveryFee,
      amount: order.deliveryFee,
    });
  }

  return lines;
}

function addressFor(order: OrderRecord): string | null {
  if (order.deliveryMethod === 'collection') return 'Collection from premises';
  return [order.town, order.county].filter(Boolean).join(', ') || null;
}

/**
 * The invoice raised the moment an order is placed — a statement of what was
 * ordered and what it costs. Nothing has been paid yet, so `amountPaid` is
 * zero and the balance is the whole total, which is exactly what a pay-on-
 * delivery customer needs to see before the van arrives.
 */
export async function invoiceFromOrder(order: OrderRecord): Promise<DocumentInput> {
  return {
    docType: 'invoice',
    source: 'order',
    orderId: order.id,
    customerName: order.isBusiness && order.companyName ? order.companyName : order.customerName,
    customerPhone: order.phone,
    customerEmail: order.email,
    customerAddress: addressFor(order),
    kraPin: order.kraPin,
    goodsCategories: await goodsCategoriesFor(order),
    lines: linesFor(order),
    vatMode: 'inclusive',
    vatRate: 16,
    amountPaid: 0,
    // M-Pesa either way: pay-now approves a prompt on the spot, pay-on-delivery
    // approves the same prompt at handover. Cash is never collected, and the
    // form saying so in print is worth more than saying it in an email.
    paymentMethod: 'mpesa',
    mpesaTill: process.env.MPESA_SHORTCODE || null,
    notes:
      order.paymentOption === 'pay_on_delivery'
        ? `Order ${order.orderNumber} — payable by M-Pesa on delivery. No cash is collected.`
        : `Order ${order.orderNumber} — M-Pesa payment requested at checkout.`,
  };
}

/**
 * The receipt raised once money has actually arrived: same goods, but now
 * carrying the M-Pesa code and the amount that landed.
 */
export async function receiptFromOrder(
  order: OrderRecord,
  payment: { amount: number; mpesaReceipt?: string | null }
): Promise<DocumentInput> {
  const invoice = await invoiceFromOrder(order);
  return {
    ...invoice,
    docType: 'receipt',
    amountPaid: payment.amount,
    mpesaCode: payment.mpesaReceipt ?? null,
    notes:
      payment.amount < order.total
        ? `Order ${order.orderNumber} — part payment received by M-Pesa.`
        : `Order ${order.orderNumber} — paid in full by M-Pesa.`,
  };
}
