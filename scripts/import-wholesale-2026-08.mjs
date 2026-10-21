/**
 * Wholesale list, 4 August 2026 — 37 products.
 *
 *   node scripts/import-wholesale-2026-08.mjs            # preview
 *   node scripts/import-wholesale-2026-08.mjs --apply    # write
 *
 * Margins are the client's own instruction of 6 August 2026:
 *   Dyness batteries   20%
 *   Solar water heaters 35%
 *   everything else     the default RETAIL_MARKUP_PERCENT
 *
 * VAT: the supplied list gives one "WHOLESALE" column with no VAT statement.
 * It is treated as EX-VAT, matching every other dealer list in this catalogue
 * (see the Chloride Exide rows, "dealer X ex-VAT, +25% then VAT"). If that is
 * wrong, every retail price here is 16% too high — change VAT_INCLUSIVE below
 * and re-run, it is idempotent.
 *
 * Idempotent: upserts on slug, so re-running corrects rather than duplicates.
 */
import { readFileSync } from 'fs';
import path from 'path';

const VAT_INCLUSIVE = false;
const LIST_DATE = '2026-08-04';
const NOTE_PREFIX = 'Wholesale list 4 Aug 2026';

const env = Object.fromEntries(
  readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);

const DEFAULT_MARKUP = Number(env.RETAIL_MARKUP_PERCENT ?? 20);

/** cost -> shelf price, the same arithmetic the app uses. */
function retailFor(cost, markup) {
  const marked = cost * (1 + markup / 100);
  return Math.ceil((VAT_INCLUSIVE ? marked : marked * 1.16) / 100) * 100;
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// [name, brand, category, subcategory, cost, markupOverride|null, keySpecs]
const ROWS = [
  // ---- Panels
  ['Longi 650W Bifacial Solar Panel, Anti-shade / Anti-dust', 'longi', 'solar-panels', 'bifacial', 15600, null, ['650 W', 'Bifacial', 'Anti-shade', 'Anti-dust']],

  // ---- Inverters
  ['SolarPro 10.2kW Hybrid Inverter, 48V', 'solarpro', 'inverters', 'hybrid', 90000, null, ['10.2 kW', '48 V']],
  ['Solis 5kW Hybrid Inverter, 48V', 'solis', 'inverters', 'hybrid', 50000, null, ['5 kW', '48 V']],
  ['Solis 6kW Hybrid Inverter, 48V', 'solis', 'inverters', 'hybrid', 120000, null, ['6 kW', '48 V']],
  ['Solis 8kW Hybrid Inverter, 48V', 'solis', 'inverters', 'hybrid', 150000, null, ['8 kW', '48 V']],
  ['Solis 10kW Single-Phase Hybrid Inverter', 'solis', 'inverters', 'hybrid', 180000, null, ['10 kW', 'Single phase']],
  ['Solis 12kW Single-Phase Hybrid Inverter (L)', 'solis', 'inverters', 'hybrid', 240000, null, ['12 kW', 'Single phase']],
  ['Solis 14kW Single-Phase Hybrid Inverter (L)', 'solis', 'inverters', 'hybrid', 230000, null, ['14 kW', 'Single phase']],
  ['Solis 16kW Single-Phase Hybrid Inverter (L)', 'solis', 'inverters', 'hybrid', 250000, null, ['16 kW', 'Single phase']],
  ['Solis 15kW Three-Phase Hybrid Inverter (L)', 'solis', 'inverters', 'hybrid', 250000, null, ['15 kW', 'Three phase']],
  ['Solis 18kW Three-Phase Hybrid Inverter (L)', 'solis', 'inverters', 'hybrid', 260000, null, ['18 kW', 'Three phase']],
  ['Solis 20kW Three-Phase Hybrid Inverter (H)', 'solis', 'inverters', 'hybrid', 250000, null, ['20 kW', 'Three phase']],
  ['Solis 30kW Three-Phase Hybrid Inverter (H)', 'solis', 'inverters', 'hybrid', 440000, null, ['30 kW', 'Three phase']],
  ['Solis 50kW Three-Phase Hybrid Inverter (H)', 'solis', 'inverters', 'hybrid', 580000, null, ['50 kW', 'Three phase']],
  ['Solis 80kW Three-Phase Hybrid Inverter (H)', 'solis', 'inverters', 'hybrid', 890000, null, ['80 kW', 'Three phase']],
  ['Solis 125kW Three-Phase Hybrid Inverter (H)', 'solis', 'inverters', 'hybrid', 1100000, null, ['125 kW', 'Three phase']],

  // ---- Lithium batteries, low voltage
  ['X-Batt 5.12kWh Lithium Battery', 'x-batt', 'battery-storage', 'wall-mounted-lv', 80000, null, ['5.12 kWh', 'Low voltage']],
  ['X-Batt 10.24kWh Lithium Battery', 'x-batt', 'battery-storage', 'wall-mounted-lv', 160000, null, ['10.24 kWh', 'Low voltage']],
  ['X-Batt 16kWh Lithium Battery', 'x-batt', 'battery-storage', 'wall-mounted-lv', 190000, null, ['16 kWh', 'Low voltage']],
  ['Dyness 5.12kWh Lithium Battery', 'dyness', 'battery-storage', 'wall-mounted-lv', 90000, 20, ['5.12 kWh', 'Low voltage']],
  ['Dyness Powerbrick 14.3kWh Lithium Battery', 'dyness', 'battery-storage', 'wall-mounted-lv', 200000, 20, ['14.3 kWh', 'Low voltage']],
  ['Dyness Powerbrick Max 16.08kWh Lithium Battery', 'dyness', 'battery-storage', 'wall-mounted-lv', 240000, 20, ['16.08 kWh', 'Low voltage']],

  // ---- Lithium batteries, high voltage
  ['Dyness HV4 Battery Disconnect Unit', 'dyness', 'battery-storage', 'high-voltage', 100000, 20, ['BDU', 'High voltage']],
  ['Dyness HV4 5.12kWh Battery Module', 'dyness', 'battery-storage', 'high-voltage', 105000, 20, ['5.12 kWh', 'High voltage']],
  ['Dyness Stack100 Battery Disconnect Unit', 'dyness', 'battery-storage', 'high-voltage', 100000, 20, ['BDU', 'High voltage']],
  ['Dyness Stack100 5.12kWh Battery Module', 'dyness', 'battery-storage', 'high-voltage', 105000, 20, ['5.12 kWh', 'High voltage']],
  ['Dyness Stack280 Battery Disconnect Unit', 'dyness', 'battery-storage', 'high-voltage', 200000, 20, ['BDU', 'High voltage']],
  ['Dyness Stack280 14.3kWh Battery Module', 'dyness', 'battery-storage', 'high-voltage', 220000, 20, ['14.3 kWh', 'High voltage']],

  // ---- Solar water heaters
  ['Pressurised Heat Pipe Solar Water Heater 200L', '', 'solar-water-heaters', '', 85000, 35, ['200 L', 'Heat pipe', 'Pressurised']],
  ['Pressurised Heat Pipe Solar Water Heater 300L', '', 'solar-water-heaters', '', 120000, 35, ['300 L', 'Heat pipe', 'Pressurised']],
  ['Pressurised Flat Plate Solar Water Heater 300L', '', 'solar-water-heaters', 'flat-plate', 135000, 35, ['300 L', 'Flat plate', 'Pressurised']],
  ['Stainless Coil Vacuum Tube Solar Water Heater 200L', '', 'solar-water-heaters', '', 55000, 35, ['200 L', 'Vacuum tube', 'Stainless coil']],
  ['Stainless Coil Vacuum Tube Solar Water Heater 300L', '', 'solar-water-heaters', '', 75000, 35, ['300 L', 'Vacuum tube', 'Stainless coil']],

  // ---- Lighting
  ['Solar Flood Light PA-B100', '', 'street-lights-cctv', 'street-lights', 2500, null, ['Flood light']],
  ['Solar Flood Light PA-A200', '', 'street-lights-cctv', 'street-lights', 6500, null, ['Flood light']],
  ['Solar Flood Light Y-200', '', 'street-lights-cctv', 'street-lights', 2000, null, ['Flood light']],
  ['Solar Street Light PA-H200', '', 'street-lights-cctv', 'street-lights', 7000, null, ['Street light']],
];

/**
 * `products.brand` is a foreign key into `brands`, so a new manufacturer has to
 * exist before its products can. The column is nullable and the Chloride rows
 * already rely on that, so the unbranded heaters and lights go in as null
 * rather than as an empty string that would fail the constraint.
 */
const NEW_BRANDS = [
  { id: 'longi', name: 'Longi' },
  { id: 'solarpro', name: 'SolarPro' },
  { id: 'x-batt', name: 'X-Batt' },
  { id: 'dyness', name: 'Dyness' },
];

const products = ROWS.map(([name, brand, category, subcategory, cost, override, keySpecs]) => {
  const markup = override ?? DEFAULT_MARKUP;
  const retail = retailFor(cost, markup);
  return {
    slug: slugify(name),
    name,
    brand: brand || null,
    model_code: null,
    category,
    subcategory,
    short_description: name,
    key_specs: keySpecs,
    images: [],
    cost_price: cost,
    markup_percent_override: override,
    retail_price: retail,
    price_status: 'ok',
    source_vat_inclusive: VAT_INCLUSIVE,
    pricing_note: `${NOTE_PREFIX}, dealer ${cost.toLocaleString('en-KE')} ${
      VAT_INCLUSIVE ? 'inc-VAT' : 'ex-VAT'
    }, +${markup}% then VAT.`,
    // No photographs were supplied with the list. Stock is unknown, and
    // claiming a count we do not have is worse than asking the customer to ring.
    stock_status: 'call_for_stock',
    stock_qty: null,
    requires_installation: category === 'solar-water-heaters' || category === 'inverters',
    source_supplier: 'Wholesale list',
    source_list_date: LIST_DATE,
    is_published: true,
    is_featured: false,
    updated_at: new Date().toISOString(),
  };
});

const apply = process.argv.includes('--apply');

console.log(`\n${apply ? 'WRITING' : 'WOULD WRITE'} ${products.length} products\n`);
console.log(
  ['SLUG', 'COST', 'MARKUP', 'RETAIL'].map((h, i) => h.padEnd([52, 12, 8, 12][i])).join('')
);
for (const p of products) {
  const markup = p.markup_percent_override ?? DEFAULT_MARKUP;
  console.log(
    p.slug.slice(0, 50).padEnd(52) +
      String(p.cost_price).padEnd(12) +
      `${markup}%`.padEnd(8) +
      String(p.retail_price).padEnd(12)
  );
}

if (!apply) {
  console.log('\nNothing written. Re-run with --apply.\n');
  process.exit(0);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const brandRes = await fetch(`${url}/rest/v1/brands?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  },
  body: JSON.stringify(NEW_BRANDS),
});
if (!brandRes.ok) {
  console.error('\nBRANDS FAILED:', brandRes.status, await brandRes.text());
  process.exit(1);
}
console.log(`\nBrands ensured: ${NEW_BRANDS.map((b) => b.id).join(', ')}`);

const res = await fetch(`${url}/rest/v1/products?on_conflict=slug`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  },
  body: JSON.stringify(products),
});

if (!res.ok) {
  console.error('\nFAILED:', res.status, await res.text());
  process.exit(1);
}
const written = await res.json();
console.log(`\nWrote ${written.length} rows.`);
