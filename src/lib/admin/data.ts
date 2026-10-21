import 'server-only';
import { cache } from 'react';
import { serviceClient } from '@/lib/supabase';
import { listOrders, type OrderRecord } from '@/lib/orders/store';

/**
 * Admin-side data access. Unlike the storefront's catalogue module this one
 * DOES expose cost price and margin — that is the point of the admin — but it
 * is server-only and every page that renders it is behind the staff gate.
 */

export type AdminProduct = {
  slug: string;
  name: string;
  brand: string;
  modelCode: string | null;
  category: string;
  subcategory: string;
  costPrice: number | null;
  sourceVatInclusive: boolean | null;
  retailPrice: number | null;
  marginKes: number | null;
  marginPercent: number | null;
  priceStatus: string;
  pricingNote: string | null;
  stockStatus: string;
  stockQty: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  imageCount: number;
  /** The photographs themselves, in shop order — the first one is the main. */
  images: ProductImage[];
  supplier: string;
};

export type ProductImage = { url: string; alt?: string; type?: string };

type RawProduct = {
  slug: string;
  name: string;
  brand: string;
  model_code: string | null;
  category: string;
  subcategory: string;
  cost_price: number | null;
  retail_price: number | null;
  markup_percent_override: number | null;
  source_vat_inclusive: boolean | null;
  price_status: string;
  pricing_note: string | null;
  stock_status: string;
  stock_qty: number | null;
  is_published: boolean;
  is_featured: boolean;
  images: unknown[];
  source_supplier: string;
};

function markupPercent(): number | null {
  const raw = process.env.RETAIL_MARKUP_PERCENT;
  if (!raw) return null;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * What a product WOULD sell for at the standard markup: markup, VAT
 * normalisation, round up. A per-product override beats the default, which is
 * how the Chloride Exide list carries its own 25%.
 *
 * This is the suggestion, not the truth — what a customer actually pays is
 * `products.retail_price`. See getAdminProducts.
 */
export function retailFor(
  cost: number | null,
  vatInclusive: boolean | null,
  overridePercent?: number | null
): number | null {
  const markup = overridePercent ?? markupPercent();
  if (cost == null || markup == null || vatInclusive == null) return null;
  const marked = cost * (1 + markup / 100);
  return Math.ceil((vatInclusive ? marked : marked * 1.16) / 100) * 100;
}

export const getAdminProducts = cache(async (): Promise<AdminProduct[]> => {
  const { data, error } = await serviceClient().from('products').select('*').order('name');
  if (error) {
    console.error('Admin product read failed:', error.message);
    return [];
  }
  return (data as unknown as RawProduct[]).map((p) => {
    // The price a customer actually pays is the stored one — that is what the
    // shop reads, and what a hand-edited price lands in. This used to recompute
    // from cost x markup and ignore it, so a price set by the owner showed the
    // old figure here while the shop showed the new one, and the margin column
    // described a sale that was not happening.
    //
    // The computed figure is still the fallback for a row that has no price
    // yet, which is the case for anything imported before it has been reviewed.
    const suggested = retailFor(p.cost_price, p.source_vat_inclusive, p.markup_percent_override);
    const retail = p.retail_price ?? suggested;
    // Margin compares like with like: retail is VAT-inclusive, so the VAT
    // portion is removed before measuring margin over cost.
    const retailExVat = retail != null ? retail / 1.16 : null;
    const costExVat =
      p.cost_price != null
        ? p.source_vat_inclusive
          ? p.cost_price / 1.16
          : p.cost_price
        : null;
    const marginKes =
      retailExVat != null && costExVat != null ? Math.round(retailExVat - costExVat) : null;
    return {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      modelCode: p.model_code,
      category: p.category,
      subcategory: p.subcategory,
      costPrice: p.cost_price,
      sourceVatInclusive: p.source_vat_inclusive,
      retailPrice: retail,
      marginKes,
      marginPercent:
        marginKes != null && costExVat != null && costExVat > 0
          ? Math.round((marginKes / costExVat) * 100)
          : null,
      priceStatus: p.price_status,
      pricingNote: p.pricing_note,
      stockStatus: p.stock_status,
      stockQty: p.stock_qty,
      isPublished: p.is_published,
      isFeatured: p.is_featured,
      imageCount: Array.isArray(p.images) ? p.images.length : 0,
      images: Array.isArray(p.images) ? (p.images as ProductImage[]) : [],
      supplier: p.source_supplier,
    };
  });
});

export type DashboardStats = {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  revenueMonth: number;
  outstandingCodValue: number;
  outstandingCodCount: number;
  awaitingPayment: number;
  outForDelivery: number;
  lowStock: AdminProduct[];
  needsReview: number;
  unpublished: number;
  missingImagery: number;
  dailySeries: { date: string; count: number; value: number }[];
  topProducts: { name: string; quantity: number; value: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const orders = await listOrders();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const since = (ms: number) => orders.filter((o) => now - new Date(o.createdAt).getTime() < ms);

  const paidStates = new Set(['paid', 'processing', 'out_for_delivery', 'delivered']);
  const monthOrders = since(30 * day);

  const codOutstanding = orders.filter(
    (o) =>
      o.paymentOption === 'pay_on_delivery' &&
      o.status !== 'cancelled' &&
      o.status !== 'refunded' &&
      !o.payments.some((p) => p.status === 'paid')
  );

  // 14-day series for the chart.
  const dailySeries: DashboardStats['dailySeries'] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now - i * day);
    start.setHours(0, 0, 0, 0);
    const end = start.getTime() + day;
    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= start.getTime() && t < end;
    });
    dailySeries.push({
      date: start.toISOString().slice(0, 10),
      count: dayOrders.length,
      value: dayOrders.reduce((s, o) => s + o.total, 0),
    });
  }

  const productTotals = new Map<string, { quantity: number; value: number }>();
  for (const order of orders) {
    for (const line of order.lines) {
      const entry = productTotals.get(line.productName) ?? { quantity: 0, value: 0 };
      entry.quantity += line.quantity;
      entry.value += line.unitPrice * line.quantity;
      productTotals.set(line.productName, entry);
    }
  }

  const products = await getAdminProducts();

  return {
    ordersToday: since(day).length,
    ordersWeek: since(7 * day).length,
    ordersMonth: monthOrders.length,
    revenueMonth: monthOrders
      .filter((o) => paidStates.has(o.status))
      .reduce((s, o) => s + o.total, 0),
    outstandingCodValue: codOutstanding.reduce((s, o) => s + o.total, 0),
    outstandingCodCount: codOutstanding.length,
    awaitingPayment: orders.filter((o) => o.status === 'pending_payment').length,
    outForDelivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    lowStock: products
      .filter((p) => p.isPublished && p.stockQty != null && p.stockQty > 0 && p.stockQty <= 3)
      .slice(0, 8),
    needsReview: products.filter((p) => p.priceStatus === 'needs_review').length,
    unpublished: products.filter((p) => !p.isPublished).length,
    missingImagery: products.filter((p) => p.isPublished && p.imageCount === 0).length,
    dailySeries,
    topProducts: Array.from(productTotals.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}

/* ------------------------------------------------------------------ */
/* Inbox sources                                                       */
/* ------------------------------------------------------------------ */

export type ContactMessage = {
  name: string;
  phone: string;
  county: string;
  need: string;
  received_at: string;
};

export type CalculatorLead = {
  email: string;
  inputs: Record<string, unknown>;
  recommendation: Record<string, unknown>;
  received_at: string;
};

export type QuoteRequest = {
  name: string;
  phone: string;
  email: string | null;
  county: string | null;
  productSlug: string | null;
  message: string | null;
  status: string;
  kind: string;
  orderNumber: string | null;
  received_at: string;
};

export async function getMessages(): Promise<ContactMessage[]> {
  const { data } = await serviceClient()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return ((data as Record<string, unknown>[]) ?? []).map((m) => ({
    name: String(m.name),
    phone: String(m.phone),
    county: String(m.county ?? ''),
    need: String(m.need ?? ''),
    received_at: String(m.created_at),
  }));
}

export async function getCalculatorLeads(): Promise<CalculatorLead[]> {
  const { data } = await serviceClient()
    .from('calculator_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  return ((data as Record<string, unknown>[]) ?? []).map((l) => ({
    email: String(l.email),
    inputs: (l.inputs as Record<string, unknown>) ?? {},
    recommendation: (l.recommendation as Record<string, unknown>) ?? {},
    received_at: String(l.created_at),
  }));
}

/** Notes carry the request kind and any order number (see /api/quotes). */
function noteValue(notes: unknown, prefix: string): string | null {
  if (!Array.isArray(notes)) return null;
  for (const note of notes as { text?: string }[]) {
    if (typeof note?.text === 'string' && note.text.startsWith(prefix)) {
      return note.text.slice(prefix.length).trim();
    }
  }
  return null;
}

export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  const { data } = await serviceClient()
    .from('quote_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  return ((data as Record<string, unknown>[]) ?? []).map((q) => ({
    name: String(q.name),
    phone: String(q.phone),
    email: (q.email as string) ?? null,
    county: (q.county as string) ?? null,
    productSlug: (q.product_slug as string) ?? null,
    message: (q.message as string) ?? null,
    status: String(q.status ?? 'new'),
    kind: noteValue(q.notes, 'Request type:') ?? 'quote',
    orderNumber: noteValue(q.notes, 'Order:'),
    received_at: String(q.created_at),
  }));
}

export type PaymentRow = {
  orderNumber: string;
  customerName: string;
  status: string;
  amount: number;
  phone: string;
  receipt?: string;
  resultDesc?: string;
  actor?: string;
  at: string;
};

export async function getPayments(): Promise<PaymentRow[]> {
  const orders = await listOrders();
  return orders
    .flatMap((o) =>
      o.payments.map((p) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        status: p.status,
        amount: p.amount,
        phone: p.phone,
        receipt: p.mpesaReceipt,
        resultDesc: p.resultDesc,
        actor: p.actor,
        at: p.at,
      }))
    )
    .sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Brands for the add-product picker. products.brand is a foreign key to
 * brands(id), so the form must offer real ids rather than free text — a typo
 * would otherwise fail the insert with a constraint error.
 */
export const getBrandOptions = cache(async (): Promise<{ id: string; name: string }[]> => {
  const { data, error } = await serviceClient().from('brands').select('id, name').order('name');
  if (error) {
    console.error('Brand read failed:', error.message);
    return [];
  }
  return (data as unknown as { id: string; name: string }[]) ?? [];
});

export type { OrderRecord };
