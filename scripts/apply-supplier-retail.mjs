/**
 * Sets retail_price from the SUPPLIER'S OWN stated retail price where the
 * pricelist publishes one, so the website matches the printed list exactly.
 *
 *   node scripts/apply-supplier-retail.mjs            # preview
 *   node scripts/apply-supplier-retail.mjs --apply    # write to Supabase
 *
 * Solargen's July 2026 list carries both "Retail Price" and "Dealer price"
 * columns, both VAT-inclusive. Their retail is not a flat markup — it varies
 * from 10% to 40% by product line — so applying a single percentage would put
 * the site out of step with the supplier on almost every item.
 *
 * Products with no supplier-stated retail keep whatever
 * scripts/apply-pricing.mjs computed from RETAIL_MARKUP_PERCENT.
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
if (!URL || !KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const retailByModel = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data', 'supplier-retail.json'), 'utf8')
);

const apply = process.argv.includes('--apply');

const res = await fetch(
  `${URL}/rest/v1/products?select=slug,model_code,name,cost_price,retail_price,module_watts`,
  { headers }
);
if (!res.ok) throw new Error(`Read failed: ${res.status}`);
const products = await res.json();

const updates = [];
for (const p of products) {
  const supplierRetail = retailByModel[p.model_code];
  if (supplierRetail == null) continue;
  // Round up to the nearest 100, consistent with the rest of the pricing.
  const retail = Math.ceil(supplierRetail / 100) * 100;
  if (p.retail_price != null && Math.abs(Number(p.retail_price) - retail) < 0.5) continue;
  updates.push({
    slug: p.slug,
    name: p.name,
    was: p.retail_price == null ? null : Number(p.retail_price),
    now: retail,
    cost: p.cost_price == null ? null : Number(p.cost_price),
    pricePerWatt: p.module_watts ? Math.round(retail / p.module_watts) : null,
  });
}

const kes = (n) => (n == null ? '—' : `KES ${Number(n).toLocaleString('en-KE')}`);

console.log(`\n${apply ? 'APPLYING' : 'WOULD APPLY'} supplier retail prices to ${updates.length} products\n`);
for (const u of updates.slice(0, 12)) {
  const margin = u.cost ? ` (${(((u.now / u.cost) - 1) * 100).toFixed(0)}% over cost)` : '';
  console.log(`  ${u.name.slice(0, 44).padEnd(46)} ${kes(u.was)} -> ${kes(u.now)}${margin}`);
}
if (updates.length > 12) console.log(`  … and ${updates.length - 12} more`);

if (!apply) {
  console.log('\nNothing changed. Re-run with --apply to write these to Supabase.\n');
  process.exit(0);
}

let done = 0;
const CONCURRENCY = 20;
for (let i = 0; i < updates.length; i += CONCURRENCY) {
  await Promise.all(
    updates.slice(i, i + CONCURRENCY).map(async (u) => {
      const r = await fetch(`${URL}/rest/v1/products?slug=eq.${encodeURIComponent(u.slug)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ retail_price: u.now, price_per_watt: u.pricePerWatt }),
      });
      if (!r.ok) throw new Error(`${u.slug}: ${r.status} ${(await r.text()).slice(0, 160)}`);
      done++;
    })
  );
  process.stdout.write(`  ${done}/${updates.length}\r`);
}

console.log(`\n\nUpdated ${done} products to the supplier's stated retail price.`);

const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const v = await fetch(`${URL}/rest/v1/products_public?select=slug&limit=1`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'count=exact' },
});
console.log(`Products visible publicly: ${(v.headers.get('content-range') ?? '').split('/')[1]}\n`);
