import 'server-only';
import { getAdminProducts, type AdminProduct } from '@/lib/admin/data';

/**
 * Inventory analysis for the admin.
 *
 * Two numbers get confused constantly and are kept apart here: what the stock
 * COST (money already spent, sitting on a shelf) and what it will SELL for
 * (money not yet earned). Reporting one as the other is how a business
 * overstates its position, so both are reported and labelled.
 *
 * Everything derives from the same product read the product list uses, so the
 * dashboard and the list can never disagree.
 */

export type CategoryLine = {
  category: string;
  total: number;
  live: number;
  outOfStock: number;
  units: number;
  costValue: number;
  retailValue: number;
};

export type InventoryReport = {
  totalProducts: number;
  liveProducts: number;
  unpublished: number;
  outOfStock: number;
  lowStock: number;
  noPrice: number;
  noImagery: number;
  needsReview: number;
  /** Units counted only where a quantity is actually recorded. */
  countedUnits: number;
  withQty: number;
  costValue: number;
  retailValue: number;
  potentialMargin: number;
  categories: CategoryLine[];
  outOfStockList: AdminProduct[];
  lowStockList: AdminProduct[];
  attentionList: AdminProduct[];
};

const LOW_STOCK_AT = 3;

export async function getInventoryReport(): Promise<InventoryReport> {
  const products = await getAdminProducts();

  const byCategory = new Map<string, CategoryLine>();
  let countedUnits = 0;
  let withQty = 0;
  let costValue = 0;
  let retailValue = 0;

  for (const p of products) {
    const qty = p.stockQty ?? 0;
    const hasQty = p.stockQty != null;
    if (hasQty) {
      withQty += 1;
      countedUnits += qty;
    }

    // Stock value only counts what is actually on the shelf. A product with no
    // recorded quantity contributes nothing rather than a guess of one.
    const cost = hasQty && p.costPrice != null ? p.costPrice * qty : 0;
    const retail = hasQty && p.retailPrice != null ? p.retailPrice * qty : 0;
    costValue += cost;
    retailValue += retail;

    const line = byCategory.get(p.category) ?? {
      category: p.category,
      total: 0,
      live: 0,
      outOfStock: 0,
      units: 0,
      costValue: 0,
      retailValue: 0,
    };
    line.total += 1;
    if (p.isPublished && p.retailPrice != null) line.live += 1;
    if (p.stockStatus === 'out_of_stock') line.outOfStock += 1;
    line.units += hasQty ? qty : 0;
    line.costValue += cost;
    line.retailValue += retail;
    byCategory.set(p.category, line);
  }

  const outOfStockList = products.filter((p) => p.stockStatus === 'out_of_stock');
  const lowStockList = products.filter(
    (p) =>
      p.stockStatus !== 'out_of_stock' &&
      p.stockQty != null &&
      p.stockQty > 0 &&
      p.stockQty <= LOW_STOCK_AT
  );

  // Things a shop owner should fix, worst first: published but unbuyable beats
  // unpublished and missing a photograph.
  const attentionList = products
    .filter(
      (p) =>
        (p.isPublished && p.retailPrice == null) ||
        p.priceStatus === 'needs_review' ||
        (p.isPublished && p.imageCount === 0)
    )
    .slice(0, 25);

  return {
    totalProducts: products.length,
    liveProducts: products.filter((p) => p.isPublished && p.retailPrice != null).length,
    unpublished: products.filter((p) => !p.isPublished).length,
    outOfStock: outOfStockList.length,
    lowStock: lowStockList.length,
    noPrice: products.filter((p) => p.retailPrice == null).length,
    noImagery: products.filter((p) => p.imageCount === 0).length,
    needsReview: products.filter((p) => p.priceStatus === 'needs_review').length,
    countedUnits,
    withQty,
    costValue: Math.round(costValue),
    retailValue: Math.round(retailValue),
    potentialMargin: Math.round(retailValue - costValue),
    categories: Array.from(byCategory.values()).sort((a, b) => b.total - a.total),
    outOfStockList,
    lowStockList,
    attentionList,
  };
}
