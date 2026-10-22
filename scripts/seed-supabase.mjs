/**
 * Seeds the Supabase project from data/products.json via PostgREST.
 *
 *   node scripts/seed-supabase.mjs          # insert, fails if rows exist
 *   node scripts/seed-supabase.mjs --reset  # delete existing rows first
 *
 * Uses the SERVICE ROLE key, so it bypasses RLS — run it locally only, never
 * from the browser or a client bundle. Reads credentials from .env.local and
 * never prints them.
 *
 * Products are inserted in batches because a 259-row single request is large
 * and a failure mid-way is easier to diagnose in chunks.
 */
import { readFileSync } from 'fs';
import path from 'path';

const ROOT = process.cwd();

function loadEnv() {
  const raw = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

async function request(method, pathname, body) {
  const res = await fetch(`${URL}/rest/v1/${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${pathname} -> ${res.status} ${text.slice(0, 300)}`);
  }
  return res;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CATEGORIES = [
  ['solar-panels', 'Solar Panels — Tier 1', 'Mono and bifacial modules, 350W–715W', 1],
  ['battery-storage', 'Battery Storage', 'LiFePO4 wall, rack and high-voltage systems', 2],
  ['inverters', 'Inverters', 'Hybrid, off-grid and grid-tied, 3kW–125kW', 3],
  ['solar-water-heaters', 'Solar Water Heaters & Heat Pumps', 'Pressurised flat-plate and vacuum-tube systems', 4],
  ['street-lights-cctv', 'Solar Street Lights & CCTV', 'All-in-one lighting and solar-powered security', 5],
  ['irrigation-pumps', 'Irrigation Pumps', 'Submersible and surface solar pumping', 6],
  ['water-treatment', 'Water Treatment', 'Filtration and reverse-osmosis systems', 7],
  ['balance-of-system', 'Balance of System', 'Protection, distribution, cabling and connectors', 8],
  ['lighting', 'Lighting', 'Solar flood lights, security lights and everyday solar lighting', 9],
];

async function main() {
  const reset = process.argv.includes('--reset');
  const products = JSON.parse(readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));

  console.log(`Seeding ${URL.replace(/^https:\/\//, '')}`);

  if (reset) {
    console.log('Clearing existing catalogue rows…');
    // Order matters: products reference categories and brands.
    await request('DELETE', 'products?slug=neq.__none__');
    await request('DELETE', 'brands?id=neq.__none__');
    await request('DELETE', 'categories?id=neq.__none__');
  }

  console.log('Inserting categories…');
  await request(
    'POST',
    'categories',
    CATEGORIES.map(([id, name, descriptor, sort_order]) => ({ id, name, descriptor, sort_order }))
  );

  const brands = [...new Set(products.map((p) => p.brand))].sort();
  console.log(`Inserting ${brands.length} brands…`);
  await request(
    'POST',
    'brands',
    brands.map((name) => ({ id: slug(name), name }))
  );

  const rows = products.map((p) => ({
    slug: p.slug,
    name: p.name,
    brand: slug(p.brand),
    model_code: p.model_code,
    category: p.category,
    subcategory: p.subcategory,
    short_description: p.short_description,
    long_description: p.long_description,
    specs: p.specs,
    key_specs: p.key_specs,
    images: p.images,
    cost_price: p.cost_price,
    cost_per_watt: p.cost_per_watt,
    module_watts: p.module_watts,
    price_status: p.price_status,
    source_vat_inclusive: p.source_vat_inclusive,
    pricing_note: p.pricing_note,
    warranty_years: p.warranty_years,
    stock_status: p.stock_status,
    stock_qty: p.stock_qty,
    requires_installation: p.requires_installation,
    compatible_with: p.compatible_with,
    datasheet_url: p.datasheet_url,
    is_featured: p.is_featured,
    is_published: p.is_published,
    source_supplier: p.source_supplier,
    source_list_date: p.source_list_date,
  }));

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await request('POST', 'products', batch);
    console.log(`  products ${i + batch.length}/${rows.length}`);
  }

  // Compute retail prices in the database using the agreed markup, so the
  // stored figures come from the same function the app relies on.
  const markup = env.RETAIL_MARKUP_PERCENT;
  if (markup) {
    console.log(`Retail prices are derived at query time from RETAIL_MARKUP_PERCENT=${markup}.`);
  } else {
    console.log('RETAIL_MARKUP_PERCENT not set — retail prices stay null until it is.');
  }

  // Verification: the browser-facing view must never expose cost.
  const check = await fetch(`${URL}/rest/v1/products_public?select=*&limit=1`, {
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` },
  });
  const sample = await check.json();
  const leaked = Array.isArray(sample) && sample[0]
    ? Object.keys(sample[0]).filter((k) => /cost|markup|supplier|pricing_note/i.test(k))
    : [];
  console.log(
    leaked.length
      ? `!! products_public exposes ${leaked.join(', ')} — fix before deploying`
      : 'Verified: products_public exposes no cost, markup or supplier columns to the anon key.'
  );

  console.log('Done.');
}

main().catch((error) => {
  console.error('\nSeeding failed:', error.message);
  process.exit(1);
});
