/**
 * Writes the imagery produced by data/harvest_chloride_missing.py onto the
 * Chloride Exide rows in Supabase, and publishes the ones that now have a
 * photograph. Products the harvest skipped are left unpublished.
 *
 *   node scripts/apply-chloride-imagery.mjs           # preview
 *   node scripts/apply-chloride-imagery.mjs --apply
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
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const apply = process.argv.includes('--apply');

const patch = JSON.parse(
  readFileSync(path.join(process.cwd(), 'data', 'chloride-image-patch.json'), 'utf8')
);

const slugs = Object.keys(patch).filter((s) => patch[s].length > 0);
console.log(`\n${apply ? 'APPLYING' : 'WOULD APPLY'} imagery to ${slugs.length} products`);

// A product is only published if it has a price to sell at.
const res = await fetch(
  `${URL}/rest/v1/products?select=slug,retail_price,is_published&slug=in.(${slugs.join(',')})`,
  { headers }
);
if (!res.ok) throw new Error(`Read failed: ${res.status} ${await res.text()}`);
const rows = new Map((await res.json()).map((r) => [r.slug, r]));

const missing = slugs.filter((s) => !rows.has(s));
if (missing.length) throw new Error(`Not in Supabase: ${missing.join(', ')}`);

const unpriced = slugs.filter((s) => rows.get(s).retail_price == null);
if (unpriced.length) console.log(`  no retail price, staying unpublished: ${unpriced.join(', ')}`);

if (!apply) {
  for (const s of slugs) console.log(`    ${patch[s].length} image(s)  ${s}`);
  console.log('\nNothing changed. Re-run with --apply.\n');
  process.exit(0);
}

let done = 0;
for (let i = 0; i < slugs.length; i += 10) {
  await Promise.all(
    slugs.slice(i, i + 10).map(async (slug) => {
      const r = await fetch(`${URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          images: patch[slug],
          is_published: rows.get(slug).retail_price != null,
        }),
      });
      if (!r.ok) throw new Error(`${slug}: ${r.status} ${(await r.text()).slice(0, 200)}`);
      done++;
    })
  );
  process.stdout.write(`  patched ${done}/${slugs.length}\r`);
}

const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const v = await fetch(`${URL}/rest/v1/products_public?select=slug&limit=1`, {
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'count=exact' },
});
console.log(`\n\nPublicly visible products: ${(v.headers.get('content-range') ?? '').split('/')[1]}\n`);
