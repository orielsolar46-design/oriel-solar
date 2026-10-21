import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentProductsBySlugs } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';

/**
 * Prices the basket server-side for the cart page. The client stores slugs
 * and quantities only; unit prices always come from here, freshly computed —
 * a stale basket can never lock in an old price.
 */
const schema = z.object({ slugs: z.array(z.string().min(1).max(200)).min(1).max(60) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const products = await getCurrentProductsBySlugs(parsed.data.slugs);
  return NextResponse.json({
    ok: true,
    items: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      modelCode: p.modelCode,
      category: p.category,
      image: p.images[0]?.url ?? null,
      unitPrice: p.quoteOnly ? null : p.retailPrice,
      quoteOnly: p.quoteOnly,
      stockStatus: p.stockStatus,
      requiresInstallation: p.requiresInstallation,
    })),
  });
}
