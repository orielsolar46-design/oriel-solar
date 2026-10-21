/**
 * Syncs data/products.json into Supabase: inserts new products, updates the
 * fields that change during content work (imagery, publish flag, pricing
 * inputs), and re-derives retail for anything newly added.
 *
 *   node scripts/sync-products.mjs           # preview
 *   node scripts/sync-products.mjs --apply
 *
 * Retail for products whose supplier states one is set by
 * apply-supplier-retail.mjs; this script only fills retail where it is null.
 */
import { readFileSync } from 'fs';
import path from 'path';

const env = Object.fromEntries(
  readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const MARKUP = Number.parseFloat(env.RETAIL_MARKUP_PERCENT ?? '');
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');

const local = JSON.parse(readFileSync(path.join(process.cwd(), 'data', 'products.json'), 'utf8'));

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const retailFor = (cost, vatInclusive) => {
  if (cost == null || !Number.isFinite(MARKUP) || vatInclusive == null) return null;
  const marked = cost * (1 + MARKUP / 100);
  return Math.ceil((vatInclusive ? marked : marked * 1.16) / 100) * 100;
};

const res = await fetch(`${URL}/rest/v1/products?select=slug,retail_price`, { headers });
if (!res.ok) throw new Error(`Read failed: ${res.status}`);
const remote = new Map((await res.json()).map((r) => [r.slug, r]));

const toInsert = local.filter((p) => !remote.has(p.slug));
const toUpdate = local.filter((p) => remote.has(p.slug));

console.log(`\n${apply ? 'SYNCING' : 'WOULD SYNC'}`);
console.log(`  new products:      ${toInsert.length}`);
console.log(`  existing to touch: ${toUpdate.length}`);
console.log(`  published locally: ${local.filter((p) => p.is_published).length}`);

if (!apply) {
  for (const p of toInsert.slice(0, 6)) console.log(`    + ${p.slug}`);
  console.log('\nNothing changed. Re-run with --apply.\n');
  process.exit(0);
}

// Insert brand rows for any brand not already present.
const brandsRes = await fetch(`${URL}/rest/v1/brands?select=id`, { headers });
const knownBrands = new Set((await brandsRes.json()).map((b) => b.id));
const newBrands = [...new Set(local.map((p) => p.brand))]
  .filter((b) => !knownBrands.has(slug(b)))
  .map((b) => ({ id: slug(b), name: b }));
if (newBrands.length) {
  const r = await fetch(`${URL}/rest/v1/brands`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(newBrands),
  });
  console.log(`  brands added: ${newBrands.map((b) => b.name).join(', ')} (${r.status})`);
}

const row = (p) => ({
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
});

if (toInsert.length) {
  for (let i = 0; i < toInsert.length; i += 40) {
    const batch = toInsert.slice(i, i + 40).map((p) => ({
      ...row(p),
      // Supplier-stated retail wins; otherwise derive from cost when present.
      // EcoFlow rows carry a direct retail price and no cost.
      retail_price: p.retail_price ?? retailFor(p.cost_price, p.source_vat_inclusive),
      price_per_watt: null,
    }));
    const r = await fetch(`${URL}/rest/v1/products`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(batch),
    });
    if (!r.ok) throw new Error(`Insert failed: ${r.status} ${(await r.text()).slice(0, 250)}`);
  }
  console.log(`  inserted ${toInsert.length}`);
}

// Update only the fields content work changes; retail is left alone.
let done = 0;
for (let i = 0; i < toUpdate.length; i += 20) {
  await Promise.all(
    toUpdate.slice(i, i + 20).map(async (p) => {
      const r = await fetch(`${URL}/rest/v1/products?slug=eq.${encodeURIComponent(p.slug)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          images: p.images,
          is_published: p.is_published,
          is_featured: p.is_featured,
          compatible_with: p.compatible_with,
          long_description: p.long_description,
          specs: p.specs,
        }),
      });
      if (!r.ok) throw new Error(`${p.slug}: ${r.status} ${(await r.text()).slice(0, 160)}`);
      done++;
    })
  );
  process.stdout.write(`  updated ${done}/${toUpdate.length}\r`);
}

const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const v = await fetch(`${URL}/rest/v1/products_public?select=slug&limit=1`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'count=exact' },
});
console.log(`\n\nPublicly visible products: ${(v.headers.get('content-range') ?? '').split('/')[1]}\n`);
