import 'server-only';
import { cache } from 'react';
import { currentPublicClient, publicClient } from '@/lib/supabase';
import { rankProducts } from '@/lib/search';

/**
 * Server-only catalogue access, backed by the `products_public` Postgres view.
 *
 * The view is the security boundary: it excludes cost_price, cost_per_watt,
 * markup overrides, supplier identity and internal pricing notes, and it only
 * exposes rows that are published AND priced. Because we read it with the
 * anon key, Row Level Security is in force as a second layer — even a bug here
 * cannot reach dealer pricing.
 *
 * The whole published catalogue is small (a few hundred rows), so it is
 * fetched once per request and filtered in memory. React's cache() dedupes the
 * fetch across every component in a single render.
 */

/**
 * Stock states as stored. `out_of_stock` is the only one a customer ever sees,
 * and then only as "Out of stock" over a dimmed card — the others are stock
 * bookkeeping for the admin. The storefront used to print "In stock" and
 * "Call for availability" on every card; it no longer does, because a buyer
 * seeing "Call for availability" simply left instead of calling.
 */
export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'on_order'
  | 'call_for_stock'
  | 'out_of_stock';

type PublicRow = {
  slug: string;
  name: string;
  brand: string | null;
  model_code: string | null;
  category: string;
  subcategory: string | null;
  short_description: string;
  long_description: string | null;
  specs: { group: string; label: string; value: string; unit: string }[] | null;
  key_specs: string[] | null;
  images: { url: string; alt: string; type: string }[] | null;
  retail_price: number | null;
  quote_only: boolean | null;
  price_per_watt: number | null;
  module_watts: number | null;
  warranty_years: number | null;
  stock_status: StockStatus;
  lead_time_days: number | null;
  requires_installation: boolean;
  compatible_with: string[] | null;
  datasheet_url: string | null;
  is_featured: boolean;
};

export type PublicProduct = {
  slug: string;
  name: string;
  brand: string;
  modelCode: string | null;
  category: string;
  subcategory: string;
  shortDescription: string;
  longDescription: string | null;
  specs: { group: string; label: string; value: string; unit: string }[];
  keySpecs: string[];
  images: { url: string; alt: string; type: string }[];
  /** VAT-inclusive retail in KES; null when quote-only. */
  retailPrice: number | null;
  /** True when retail exceeds KES 500,000 — price hidden, quote required. */
  quoteOnly: boolean;
  pricePerWatt: number | null;
  moduleWatts: number | null;
  warrantyYears: number | null;
  stockStatus: StockStatus;
  /** The one stock fact the storefront acts on: dim it, and block the basket. */
  outOfStock: boolean;
  leadTimeDays: number | null;
  requiresInstallation: boolean;
  compatibleWith: string[];
  datasheetUrl: string | null;
  isFeatured: boolean;
  /** single | three | null when not applicable. */
  phase: 'single' | 'three' | null;
};

/**
 * Brand ids are slugs in the database; render the human name. A handful of
 * brands are stylised (EcoFlow, Bluetti) and cannot be recovered by
 * title-casing the slug, so they carry an explicit label.
 */
const BRAND_LABELS: Record<string, string> = {
  ecoflow: 'EcoFlow',
  bluetti: 'Bluetti',
  blueetti: 'Bluetti',
};

function brandName(id: string | null): string {
  if (!id) return '';
  if (BRAND_LABELS[id]) return BRAND_LABELS[id];
  return id
    .split('-')
    .map((part) =>
      part === 'tw' ? 'TW' : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(' ');
}

function detectPhase(name: string, keySpecs: string[]): 'single' | 'three' | null {
  const haystack = `${name} ${keySpecs.join(' ')}`.toLowerCase();
  if (/three[ -]phase|3ph\b|\b3p\b/.test(haystack)) return 'three';
  if (/single[ -]phase|1ph\b|\b1p\b/.test(haystack)) return 'single';
  return null;
}

function toPublic(row: PublicRow): PublicProduct {
  const keySpecs = row.key_specs ?? [];
  return {
    slug: row.slug,
    name: row.name,
    brand: brandName(row.brand),
    modelCode: row.model_code,
    category: row.category,
    subcategory: row.subcategory ?? '',
    shortDescription: row.short_description,
    longDescription: row.long_description,
    specs: row.specs ?? [],
    keySpecs,
    images: row.images ?? [],
    retailPrice: row.retail_price,
    quoteOnly: Boolean(row.quote_only),
    pricePerWatt: row.price_per_watt,
    moduleWatts: row.module_watts,
    warrantyYears: row.warranty_years,
    stockStatus: row.stock_status,
    outOfStock: row.stock_status === 'out_of_stock',
    leadTimeDays: row.lead_time_days,
    requiresInstallation: row.requires_installation,
    compatibleWith: row.compatible_with ?? [],
    datasheetUrl: row.datasheet_url,
    isFeatured: row.is_featured,
    phase: detectPhase(row.name, keySpecs),
  };
}

/** The published, priced catalogue. Cached per request. */
export const getCatalogue = cache(async (): Promise<PublicProduct[]> => {
  const { data, error } = await publicClient()
    .from('products_public')
    .select('*')
    .order('name');

  if (error) {
    // A catalogue read failure must not take the whole site down; pages
    // render their empty states instead.
    console.error('Catalogue read failed:', error.message);
    return [];
  }
  return (data as unknown as PublicRow[]).map(toPublic);
});

export type ShopFilters = {
  category?: string;
  type?: string;
  brand?: string;
  phase?: 'single' | 'three';
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
};

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name';

export async function getAllProducts(): Promise<PublicProduct[]> {
  return getCatalogue();
}

export async function getProduct(slug: string): Promise<PublicProduct | undefined> {
  return (await getCatalogue()).find((p) => p.slug === slug);
}

export async function getProductsBySlugs(slugs: string[]): Promise<PublicProduct[]> {
  const wanted = new Set(slugs);
  return (await getCatalogue()).filter((p) => wanted.has(p.slug));
}

/**
 * The current catalogue values for checkout and order creation. Unlike the
 * browsing catalogue, this deliberately bypasses Next's Data Cache so a
 * change made in admin can never leave a buyer seeing or paying an old price.
 */
export async function getCurrentProductsBySlugs(slugs: string[]): Promise<PublicProduct[]> {
  const uniqueSlugs = Array.from(new Set(slugs));
  if (uniqueSlugs.length === 0) return [];

  const { data, error } = await currentPublicClient()
    .from('products_public')
    .select('*')
    .in('slug', uniqueSlugs);

  if (error) {
    console.error('Current catalogue read failed:', error.message);
    return [];
  }
  return (data as unknown as PublicRow[]).map(toPublic);
}

export async function getCurrentProduct(slug: string): Promise<PublicProduct | undefined> {
  return (await getCurrentProductsBySlugs([slug]))[0];
}

export async function filterProducts(filters: ShopFilters): Promise<PublicProduct[]> {
  let items = await getCatalogue();
  if (filters.category) items = items.filter((p) => p.category === filters.category);
  if (filters.type) items = items.filter((p) => p.subcategory === filters.type);
  if (filters.brand) items = items.filter((p) => p.brand === filters.brand);
  if (filters.phase) items = items.filter((p) => p.phase === filters.phase);
  if (filters.availability) items = items.filter((p) => p.stockStatus === filters.availability);
  if (filters.minPrice != null)
    items = items.filter((p) => p.retailPrice != null && p.retailPrice >= filters.minPrice!);
  if (filters.maxPrice != null)
    items = items.filter((p) => p.retailPrice != null && p.retailPrice <= filters.maxPrice!);
  if (filters.q) {
    // The same ranker the search page uses: a word can land in the name, the
    // brand, the model code, the family or the specification, and a near
    // miss still counts.
    items = rankProducts(items, filters.q).map((hit) => hit.item);
  }
  return items;
}

/**
 * The four Bluetti flagships shown on the home page. They are pinned above
 * the rest of the brand range so the shop opens on the same ladder.
 */
export const BLUETTI_FLAGSHIP_SLUGS = [
  'bluetti-homestar-3',
  'bluetti-ep760',
  'bluetti-ac500',
  'bluetti-ac200pl',
] as const;

/** Brand pages lead with batteries and end with accessories. */
const BRAND_CATEGORY_RANK: Record<string, number> = {
  'battery-storage': 0,
  inverters: 1,
  'solar-panels': 2,
  'balance-of-system': 3,
};

export function sortProducts(
  items: PublicProduct[],
  sort: SortKey,
  options?: { brandFirst?: boolean; pinned?: readonly string[] }
): PublicProduct[] {
  const copy = [...items];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => (a.retailPrice ?? Infinity) - (b.retailPrice ?? Infinity));
    case 'price-desc':
      return copy.sort((a, b) => (b.retailPrice ?? -1) - (a.retailPrice ?? -1));
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => {
        if (options?.pinned) {
          const pinnedRank = (p: PublicProduct) => {
            const index = options.pinned!.indexOf(p.slug);
            return index === -1 ? Number.MAX_SAFE_INTEGER : index;
          };
          const byPin = pinnedRank(a) - pinnedRank(b);
          if (byPin !== 0) return byPin;
        }
        if (options?.brandFirst) {
          const rank = (p: PublicProduct) => BRAND_CATEGORY_RANK[p.category] ?? 9;
          const byCategory = rank(a) - rank(b);
          if (byCategory !== 0) return byCategory;
          // Within a family the biggest station comes first, so the page reads
          // as a ladder rather than alphabetically.
          const byPrice = (b.retailPrice ?? -1) - (a.retailPrice ?? -1);
          if (byPrice !== 0) return byPrice;
        }
        return (
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(b.images.length > 0) - Number(a.images.length > 0) ||
          a.name.localeCompare(b.name)
        );
      });
  }
}

export async function getFeaturedProducts(): Promise<PublicProduct[]> {
  return (await getCatalogue()).filter((p) => p.isFeatured);
}

export type CategoryShowcase = {
  slug: string;
  total: number;
  products: PublicProduct[];
};

/**
 * The home page's per-family rows: a few products from each stocked family,
 * with the total so the row can offer "view all N".
 *
 * There is no sales history to rank by, so the order is deterministic and
 * explainable: anything the client flagged as featured first, then what is
 * actually in stock, then cheapest first. Cheapest-first is deliberate — the
 * entry price is what makes a visitor believe the range is affordable, and
 * every card carries its own Add to basket.
 *
 * A family is only shown once it can fill the row. One lonely product under a
 * heading reads as a shop that has run out, which is worse than routing that
 * family through the grid above.
 */
export async function getCategoryShowcases(perCategory = 3): Promise<CategoryShowcase[]> {
  const catalogue = await getCatalogue();
  const byCategory = new Map<string, PublicProduct[]>();
  for (const p of catalogue) {
    if (p.images.length === 0) continue;
    const list = byCategory.get(p.category);
    if (list) list.push(p);
    else byCategory.set(p.category, [p]);
  }

  const rank = (p: PublicProduct) => {
    if (p.isFeatured) return 0;
    if (p.stockStatus === 'in_stock') return 1;
    if (p.stockStatus === 'low_stock') return 2;
    return 3;
  };

  const showcases: CategoryShowcase[] = [];
  for (const [slug, items] of Array.from(byCategory)) {
    if (items.length < perCategory) continue;
    const ordered = [...items].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      // Quote-only products have no price to compare, so they sit last.
      const priceA = a.retailPrice ?? Number.POSITIVE_INFINITY;
      const priceB = b.retailPrice ?? Number.POSITIVE_INFINITY;
      if (priceA !== priceB) return priceA - priceB;
      return a.name.localeCompare(b.name);
    });
    showcases.push({ slug, total: items.length, products: ordered.slice(0, perCategory) });
  }
  return showcases;
}

export async function categoryCount(category: string): Promise<number> {
  return (await getCatalogue()).filter((p) => p.category === category).length;
}
