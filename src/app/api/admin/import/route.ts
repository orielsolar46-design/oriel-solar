import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sessionCookieName, verifySessionToken } from '@/lib/admin/session';
import { getAdminProducts, retailFor } from '@/lib/admin/data';

/**
 * Supplier price import — diff preview and apply.
 *
 * The client sends parsed CSV rows plus a column mapping; this route matches
 * them to the catalogue and returns a per-row verdict. NOTHING is written
 * until a second call with mode: 'apply', so the client always sees exactly
 * what will change before it changes (MASTERPLAN 13).
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  mode: z.enum(['preview', 'apply']),
  rows: z
    .array(z.object({ match: z.string().max(200), cost: z.string().max(40) }))
    .min(1)
    .max(2000),
  /** How to find the product: by model code or by name. */
  matchBy: z.enum(['model_code', 'name']),
});

function authorised(request: Request): boolean {
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([name]) => name === sessionCookieName())?.[1];
  return verifySessionToken(cookie ? decodeURIComponent(cookie) : undefined);
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Check the file and the column mapping.' },
      { status: 400 }
    );
  }

  const catalogue = await getAdminProducts();
  const index = new Map<string, (typeof catalogue)[number]>();
  for (const p of catalogue) {
    const key = (parsed.data.matchBy === 'model_code' ? p.modelCode : p.name)
      ?.toLowerCase()
      .trim();
    if (key) index.set(key, p);
  }

  const results = parsed.data.rows.map((row) => {
    const key = row.match.toLowerCase().trim();
    const product = index.get(key);
    const newCost = parseAmount(row.cost);

    if (!product) {
      return {
        match: row.match,
        verdict: 'new' as const,
        message: 'No catalogue item matches — would be added as a new product',
        newCost,
      };
    }
    if (newCost == null) {
      return {
        match: row.match,
        verdict: 'skipped' as const,
        message: 'No usable price in this row',
        name: product.name,
      };
    }
    if (product.costPrice != null && Math.abs(product.costPrice - newCost) < 0.5) {
      return {
        match: row.match,
        verdict: 'unchanged' as const,
        name: product.name,
        oldCost: product.costPrice,
        newCost,
      };
    }
    return {
      match: row.match,
      verdict: 'changed' as const,
      name: product.name,
      oldCost: product.costPrice,
      newCost,
      oldRetail: product.retailPrice,
      newRetail: retailFor(newCost, product.sourceVatInclusive),
    };
  });

  const summary = {
    new: results.filter((r) => r.verdict === 'new').length,
    changed: results.filter((r) => r.verdict === 'changed').length,
    unchanged: results.filter((r) => r.verdict === 'unchanged').length,
    skipped: results.filter((r) => r.verdict === 'skipped').length,
  };

  if (parsed.data.mode === 'preview') {
    return NextResponse.json({ ok: true, mode: 'preview', summary, results });
  }

  // Apply is intentionally not wired to a write yet: the catalogue is a
  // generated file (data/build_catalogue.py) until Supabase is provisioned,
  // and silently diverging the JSON from its generator would break the next
  // rebuild. The diff below is what will be written to the products table.
  return NextResponse.json({
    ok: false,
    mode: 'apply',
    summary,
    error:
      'Applying imports writes to the products table, which needs the Supabase project. The preview above is exactly what will be applied once it is connected.',
  });
}
