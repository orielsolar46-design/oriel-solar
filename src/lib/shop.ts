/**
 * Shared, client-safe shop helpers: currency formatting, label maps and
 * URL-filter parsing. No pricing arithmetic and no catalogue data lives here.
 */

export function formatKes(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export const SUBCATEGORY_LABELS: Record<string, string> = {
  monocrystalline: 'Monocrystalline',
  bifacial: 'Bifacial',
  'mounting-rails': 'Mounting & rails',
  'wall-mounted-lv': 'Wall-mounted LV',
  'rack-lv': 'Rack LV',
  'high-voltage': 'High-voltage',
  'ci-cabinets': 'C&I cabinets',
  '12v-24v': '12V / 24V',
  accessories: 'Accessories',
  hybrid: 'Hybrid',
  'off-grid': 'Off-grid',
  'grid-tied': 'Grid-tied',
  'all-in-one-ess': 'All-in-one ESS',
  'charge-controllers': 'Charge controllers',
  'flat-plate': 'Flat plate',
  'vacuum-tube': 'Vacuum tube',
  'heat-pumps': 'Heat pumps',
  spares: 'Spares',
  'street-lights': 'Street lights',
  'flood-lights': 'Flood lights',
  'solar-cctv': 'Solar CCTV',
  submersible: 'Submersible',
  surface: 'Surface',
  'controllers-drives': 'Controllers & drives',
  'reverse-osmosis': 'Reverse osmosis',
  filtration: 'Filtration',
  softeners: 'Softeners',
  protection: 'Protection & distribution',
  'cables-connectors': 'Cables & connectors',
};

export const STOCK_LABELS: Record<string, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  on_order: 'On order',
  call_for_stock: 'Call for availability',
};

/**
 * Short forms for the pill on a product card. At two cards across a phone the
 * card is ~155px wide and "Call for availability" truncates mid-word, which
 * reads worse than saying less. Only that one label actually differs.
 */
export const STOCK_LABELS_SHORT: Record<string, string> = {
  ...STOCK_LABELS,
  call_for_stock: 'Call us',
};

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
] as const;

export const PAGE_SIZE = 24;

export type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export function parseShopParams(params: SearchParams) {
  const num = (v: string | undefined) => {
    const n = v ? Number.parseInt(v, 10) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const phase = first(params.phase);
  const sort = first(params.sort);
  return {
    type: first(params.type),
    brand: first(params.brand),
    phase: (phase === 'single' || phase === 'three' ? phase : undefined) as
      | 'single'
      | 'three'
      | undefined,
    availability: first(params.availability),
    minPrice: num(first(params.min)),
    maxPrice: num(first(params.max)),
    q: first(params.q),
    sort: (['relevance', 'price-asc', 'price-desc', 'name'].includes(sort ?? '')
      ? sort
      : 'relevance') as 'relevance' | 'price-asc' | 'price-desc' | 'name',
    page: Math.max(1, num(first(params.page)) ?? 1),
    view: first(params.view) === 'list' ? ('list' as const) : ('grid' as const),
  };
}

/** Rebuild a query string, dropping empty values and resetting the page. */
export function buildShopQuery(
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined>
): string {
  const merged: Record<string, string | undefined> = { ...current, ...changes, page: undefined };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}
