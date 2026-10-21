import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminWrite } from '@/lib/admin/guard';
import { revalidateCatalogue } from '@/lib/admin/revalidate';
import { serviceClient } from '@/lib/supabase';

/**
 * Per-product admin mutations: stock state, publication, and deletion.
 *
 * Everything here bypasses RLS through the service client, so the staff gate
 * is the only thing standing between the open internet and the catalogue. It
 * is checked first, before the body is even read.
 *
 * Deletion is soft by default. A product that has ever been ordered must not
 * vanish — order lines reference it by slug, and an order history that cannot
 * name what was bought is worse than a cluttered product list. `?hard=1`
 * forces a real delete and is refused when the slug appears in any order.
 */
export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  stockStatus: z
    .enum(['in_stock', 'low_stock', 'on_order', 'call_for_stock', 'out_of_stock'])
    .optional(),
  stockQty: z.number().int().min(0).max(100000).nullable().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  /**
   * What the customer pays, VAT-inclusive. Stored rather than recomputed: a
   * hand-set price beats the markup suggestion, which is the whole point of
   * being able to edit it. Capped well above any real solar price so a
   * mistyped figure with three extra digits is refused rather than published.
   */
  retailPrice: z.number().int().min(0).max(100000000).nullable().optional(),
  /**
   * The photographs, in shop order — first is the main one. Sent whole rather
   * than as add/remove operations so reordering and deleting are one write and
   * cannot half-apply. URLs must sit on our own storage: accepting an arbitrary
   * URL here would let a product page hotlink anywhere.
   */
  images: z
    .array(
      z.object({
        url: z.string().url().max(500),
        alt: z.string().max(200).optional(),
        type: z.string().max(50).optional(),
      })
    )
    .max(3)
    .optional(),
});

function deny(request: Request) {
  const failure = guardAdminWrite(request);
  return failure
    ? NextResponse.json({ ok: false, error: failure.error }, { status: failure.status })
    : null;
}

export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const denied = deny(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Nothing valid to change' }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.stockStatus !== undefined) patch.stock_status = parsed.data.stockStatus;
  if (parsed.data.stockQty !== undefined) patch.stock_qty = parsed.data.stockQty;
  if (parsed.data.isPublished !== undefined) patch.is_published = parsed.data.isPublished;
  if (parsed.data.isFeatured !== undefined) patch.is_featured = parsed.data.isFeatured;
  if (parsed.data.retailPrice !== undefined) patch.retail_price = parsed.data.retailPrice;
  if (parsed.data.images !== undefined) patch.images = parsed.data.images;

  // Marking something out of stock while its quantity still reads 8 leaves the
  // dashboard contradicting the shop, so the two are kept honest together.
  if (parsed.data.stockStatus === 'out_of_stock' && parsed.data.stockQty === undefined) {
    patch.stock_qty = 0;
  }

  const db = serviceClient();
  const { data: existing } = await db
    .from('products')
    .select('category')
    .eq('slug', params.slug)
    .maybeSingle();

  const { error } = await db.from('products').update(patch).eq('slug', params.slug);

  if (error) {
    // The enum value only exists once migration 0003 has been run. Say so
    // plainly rather than surfacing a Postgres type error to a shop owner.
    const missingEnum = /invalid input value for enum/i.test(error.message);
    return NextResponse.json(
      {
        ok: false,
        error: missingEnum
          ? 'Out of stock is not enabled on the database yet — run migration 0003 in the Supabase SQL Editor.'
          : error.message,
      },
      { status: missingEnum ? 409 : 500 }
    );
  }

  revalidateCatalogue(
    existing ? { category: (existing as { category: string }).category, slug: params.slug } : undefined
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  const denied = deny(request);
  if (denied) return denied;

  const hard = new URL(request.url).searchParams.get('hard') === '1';
  const db = serviceClient();

  if (hard) {
    // order_items references products(id), not the slug, so resolve the id
    // first. There is a foreign key behind this too — the check exists to
    // give a sentence a shop owner can act on instead of a constraint error.
    const { data: row } = await db
      .from('products')
      .select('id')
      .eq('slug', params.slug)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ ok: false, error: 'No such product' }, { status: 404 });
    }

    const { count } = await db
      .from('order_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', (row as { id: string }).id);

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'This product appears on past orders, so it cannot be erased. Remove it from the shop instead — it stays in your order history.',
        },
        { status: 409 }
      );
    }

    const { error } = await db.from('products').delete().eq('slug', params.slug);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    revalidateCatalogue();
    return NextResponse.json({ ok: true, removed: 'permanently' });
  }

  const { error } = await db
    .from('products')
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq('slug', params.slug);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  revalidateCatalogue();
  return NextResponse.json({ ok: true, removed: 'from the shop' });
}
