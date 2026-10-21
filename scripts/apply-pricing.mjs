/**
 * Computes and stores retail_price (and price_per_watt for panels) for every
 * product, using the same rules as the rest of the build:
 *
 *   retail = cost x (1 + markup%)  ->  normalise to VAT-inclusive  ->  round UP to KES 100
 *
 * Products whose source VAT status is unknown keep a null retail price and
 * stay out of the public view, exactly as intended — nothing ambiguous is
 * ever published.
 *
 * RE-RUN THIS whenever RETAIL_MARKUP_PERCENT changes. It is idempotent.
 *
 *   node scripts/apply-pricing.mjs
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

if (!URL || !KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}
if (!Number.isFinite(MARKUP) || MARKUP <= 0) {
  console.error('RETAIL_MARKUP_PERCENT is not set to a positive number in .env.local.');
  console.error('Nothing was changed — prices stay null until the markup is confirmed.');
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

/** Identical arithmetic to compute_retail_price() and lib/catalogue.ts. */
function retailFor(cost, vatInclusive) {
  if (cost == null || vatInclusive == null) return null;
  const marked = cost * (1 + MARKUP / 100);
  return Math.ceil((vatInclusive ? marked : marked * 1.16) / 100) * 100;
}

async function main() {
  console.log(`Applying markup of ${MARKUP}% to ${URL.replace(/^https:\/\//, '')}`);
  if (env.RETAIL_MARKUP_PERCENT === '25') {
    console.log('NOTE: 25% is the development sample value, not a confirmed client margin.');
  }

  const res = await fetch(
    `${URL}/rest/v1/products?select=slug,cost_price,source_vat_inclusive,module_watts`,
    { headers }
  );
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${await res.text()}`);
  const products = await res.json();
  console.log(`Read ${products.length} products.`);

  let priced = 0;
  let skipped = 0;
  const updates = products.map((p) => {
    const retail = retailFor(p.cost_price, p.source_vat_inclusive);
    if (retail == null) skipped++;
    else priced++;
    return {
      slug: p.slug,
      retail_price: retail,
      price_per_watt:
        retail != null && p.module_watts ? Math.round(retail / p.module_watts) : null,
    };
  });

  // PATCH per product rather than upsert: an upsert would need every NOT NULL
  // column resent, and we only want to touch the two price fields.
  const CONCURRENCY = 20;
  for (let i = 0; i < updates.length; i += CONCURRENCY) {
    const chunk = updates.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async ({ slug, ...fields }) => {
        const r = await fetch(
          `${URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`,
          {
            method: 'PATCH',
            headers: { ...headers, Prefer: 'return=minimal' },
            body: JSON.stringify(fields),
          }
        );
        if (!r.ok) {
          throw new Error(`${slug}: ${r.status} ${(await r.text()).slice(0, 200)}`);
        }
      })
    );
    process.stdout.write(`  ${Math.min(i + CONCURRENCY, updates.length)}/${updates.length}\r`);
  }

  console.log(`\n  ${priced} priced, ${skipped} left null (VAT status unknown — correct).`);

  // Confirm the public view now serves the catalogue, and still hides cost.
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const v = await fetch(`${URL}/rest/v1/products_public?select=*&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'count=exact' },
  });
  const rows = await v.json();
  const count = (v.headers.get('content-range') ?? '').split('/')[1];
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const unsafe = columns.filter((c) => /cost|markup|supplier|pricing_note/i.test(c));

  console.log(`\nProducts visible to the public view: ${count}`);
  console.log(
    unsafe.length
      ? `!! LEAK: products_public exposes ${unsafe.join(', ')}`
      : 'Verified: products_public exposes no cost, markup, supplier or internal note columns.'
  );
}

main().catch((e) => {
  console.error('\nFailed:', e.message);
  process.exit(1);
});
