import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/catalogue';
import { rankCategories, rankProducts } from '@/lib/search';

/**
 * Search suggestions for the header search box.
 *
 * Public by design: it returns the same published, priced products the
 * catalogue pages show and nothing else — no cost price, no supplier, no
 * stock notes beyond what a card already shows.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [], total: 0 });
  }

  const products = await getAllProducts();
  const productHits = rankProducts(products, q);
  const categoryHits = rankCategories(q).slice(0, 3);

  return NextResponse.json(
    {
      total: productHits.length,
      products: productHits.slice(0, 6).map((hit) => ({
        slug: hit.item.slug,
        name: hit.item.name,
        brand: hit.item.brand,
        price: hit.item.retailPrice,
        image: hit.item.images[0]?.url ?? null,
        href: `/shop/${hit.item.category}/${hit.item.slug}`,
        matchedIn: hit.fields[0] ?? null,
      })),
      categories: categoryHits.map((hit) => ({
        name: hit.item.name,
        descriptor: hit.item.descriptor,
        kind: hit.item.kind,
        href: hit.item.href,
      })),
    },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  );
}
