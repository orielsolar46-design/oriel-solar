import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminWrite } from '@/lib/admin/guard';
import { revalidateCatalogue } from '@/lib/admin/revalidate';
import { serviceClient } from '@/lib/supabase';

/**
 * Create a product from the admin.
 *
 * The catalogue was built by importing supplier price lists, so every existing
 * row carries a supplier and a list date. A product added by hand has neither,
 * and pretending otherwise would poison the margin reporting — so it is
 * recorded honestly as entered in the admin.
 *
 * Price is entered as the selling price. The import path derives retail from
 * dealer cost and a markup, but a shop owner adding their own stock knows what
 * they intend to charge, not what a spreadsheet says it cost. Cost is optional
 * and only drives the margin column.
 *
 * A product is only reachable on the shop when it is published, priced and
 * carries at least one photograph — that is the products_public view's own
 * rule, so the response says which of the three is missing rather than
 * leaving someone hunting for a page that silently does not exist.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(3).max(200),
  category: z.string().trim().min(1).max(60),
  subcategory: z.string().trim().max(60).optional().default(''),
  brand: z.string().trim().max(60).optional().default(''),
  modelCode: z.string().trim().max(80).optional().default(''),
  shortDescription: z.string().trim().min(10).max(400),
  longDescription: z.string().trim().max(4000).optional().default(''),
  retailPrice: z.number().positive().max(100_000_000).nullable(),
  costPrice: z.number().positive().max(100_000_000).nullable().optional(),
  keySpecs: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
  warrantyYears: z.number().min(0).max(50).nullable().optional(),
  stockQty: z.number().int().min(0).max(100000).nullable().optional(),
  stockStatus: z
    .enum(['in_stock', 'low_stock', 'on_order', 'call_for_stock', 'out_of_stock'])
    .default('in_stock'),
  requiresInstallation: z.boolean().default(false),
  images: z
    .array(z.object({ url: z.string().url(), alt: z.string().max(300), type: z.string().max(30) }))
    .max(3)
    .optional()
    .default([]),
  isPublished: z.boolean().default(true),
});

/** URL-safe, collision-checked below. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
}

export async function POST(request: Request) {
  const denied = guardAdminWrite(request);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `${first.path.join('.') || 'Form'}: ${first.message}` },
      { status: 400 }
    );
  }
  const p = parsed.data;
  const db = serviceClient();

  // Category must exist — products.category is a foreign key, and a bad value
  // would otherwise surface as a constraint error nobody can read.
  const { data: cat } = await db
    .from('categories')
    .select('id')
    .eq('id', p.category)
    .maybeSingle();
  if (!cat) {
    return NextResponse.json({ ok: false, error: 'Choose a category' }, { status: 400 });
  }

  // Brand is a foreign key too, and nullable. Only set it when it resolves.
  let brandId: string | null = null;
  if (p.brand) {
    const { data: b } = await db.from('brands').select('id').eq('id', p.brand).maybeSingle();
    brandId = b ? p.brand : null;
  }

  // Unique slug. Two "Solar Panel 550W" entries a month apart must not collide.
  const base = slugify(p.name) || 'product';
  let slug = base;
  for (let n = 2; n < 50; n += 1) {
    const { data: clash } = await db.from('products').select('slug').eq('slug', slug).maybeSingle();
    if (!clash) break;
    slug = `${base}-${n}`;
  }

  const row = {
    slug,
    name: p.name,
    brand: brandId,
    model_code: p.modelCode || null,
    category: p.category,
    subcategory: p.subcategory || null,
    short_description: p.shortDescription,
    long_description: p.longDescription || null,
    specs: [],
    key_specs: p.keySpecs,
    images: p.images,
    cost_price: p.costPrice ?? null,
    retail_price: p.retailPrice,
    price_status: 'ok',
    source_vat_inclusive: true,
    warranty_years: p.warrantyYears ?? null,
    stock_status: p.stockStatus,
    stock_qty: p.stockQty ?? null,
    requires_installation: p.requiresInstallation,
    compatible_with: [],
    is_featured: false,
    is_published: p.isPublished,
    source_supplier: 'Added in admin',
    source_list_date: new Date().toISOString().slice(0, 7),
  };

  const { error } = await db.from('products').insert(row);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  revalidateCatalogue({ category: p.category, slug });

  const live = p.isPublished && p.retailPrice != null && p.images.length > 0;
  return NextResponse.json({
    ok: true,
    slug,
    live,
    href: `/shop/${p.category}/${slug}`,
    note: live
      ? null
      : p.retailPrice == null
        ? 'Saved, but it will not appear on the shop until it has a price.'
        : p.images.length === 0
          ? 'Saved, but it will not appear on the shop until it has at least one photograph.'
          : 'Saved as unpublished. Use Put back on the product list to make it live.',
  });
}
