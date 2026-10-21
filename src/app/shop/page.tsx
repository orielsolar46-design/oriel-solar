import type { Metadata } from 'next';
import { filterProducts, sortProducts } from '@/lib/catalogue';
import { PAGE_SIZE, parseShopParams, type SearchParams } from '@/lib/shop';
import { Pagination } from '@/components/shop/pagination';
import { ProductCard } from '@/components/shop/product-card';
import { Toolbar } from '@/components/shop/toolbar';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Shop all solar products in Kenya',
  description:
    'The full Oriel Solar catalogue: Tier 1 solar panels, LiFePO4 batteries, hybrid inverters, water heaters, street lights, pumps and balance of system — M-Pesa accepted.',
  // Filters, sort and paging all live in query strings; without this every
  // combination becomes its own indexable duplicate of the shop.
  alternates: { canonical: '/shop' },
};

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const parsed = parseShopParams(searchParams);
  const items = sortProducts(
    await filterProducts({
      type: parsed.type,
      brand: parsed.brand,
      phase: parsed.phase,
      availability: parsed.availability,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
    }),
    parsed.sort,
    { ecoflowFirst: parsed.brand === 'EcoFlow' }
  );
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(parsed.page, totalPages);
  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const query: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    query[k] = Array.isArray(v) ? v[0] : v;
  }

  return (
    <>
      <section className="bg-oriel-mist">
        <div className="container-oriel py-8 lg:py-10">
          <h1 className="t-h1 text-oriel-navy">All products</h1>
          <p className="mt-3 max-w-3xl text-body text-oriel-navy-ink">
            Anything above KES 500,000 is priced per project.
          </p>
        </div>
      </section>

      <section className="container-oriel py-8">
        <Toolbar total={items.length} />
        {visible.length === 0 ? (
          <div className="mt-8 rounded-card border border-oriel-line bg-oriel-mist p-8 text-center">
            <p className="text-body text-oriel-navy-ink">Nothing here yet.</p>
            <p className="mt-1 text-small text-oriel-slate">
              This range is still being added. Ask us on WhatsApp and we will source it for you.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'mt-5',
              parsed.view === 'list'
                ? 'flex flex-col gap-4'
                : 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4'
            )}
          >
            {visible.map((p) => (
              <ProductCard key={p.slug} product={p} view={parsed.view} />
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} basePath="/shop" query={query} />
      </section>
    </>
  );
}
