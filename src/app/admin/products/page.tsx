import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, ImageOff, Lock, PackageX } from 'lucide-react';
import { ProductActions } from '@/components/admin/product-actions';
import { getAdminProducts } from '@/lib/admin/data';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';
import { EmptyState, FilterChips, PageHeader, Pill } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'unpublished', label: 'Unpublished' },
  { id: 'needs_review', label: 'Needs review' },
  { id: 'no_images', label: 'No imagery' },
  { id: 'low_stock', label: 'Low stock' },
];

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: { filter?: string; q?: string; category?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const all = await getAdminProducts();
  const filter = searchParams.filter ?? '';
  const q = (searchParams.q ?? '').toLowerCase().trim();

  let products = all;
  if (filter === 'published') products = products.filter((p) => p.isPublished);
  if (filter === 'unpublished') products = products.filter((p) => !p.isPublished);
  if (filter === 'needs_review') products = products.filter((p) => p.priceStatus === 'needs_review');
  if (filter === 'no_images') products = products.filter((p) => p.imageCount === 0);
  if (filter === 'low_stock')
    products = products.filter((p) => p.stockQty != null && p.stockQty > 0 && p.stockQty <= 3);
  if (searchParams.category) products = products.filter((p) => p.category === searchParams.category);
  if (q)
    products = products.filter((p) =>
      `${p.name} ${p.brand} ${p.modelCode ?? ''}`.toLowerCase().includes(q)
    );

  const categories = Array.from(new Set(all.map((p) => p.category))).sort();

  return (
    <div className="space-y-5">
      <PageHeader title="Products" subtitle={`${products.length} of ${all.length} items`}>
        <Link
          href="/admin/products/new"
          className="flex h-11 items-center rounded-input bg-oriel-orange px-4 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
        >
          Add a product
        </Link>
        <Link
          href="/admin/import"
          className="flex h-11 items-center rounded-input border border-oriel-line bg-oriel-white px-4 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
        >
          Import prices
        </Link>
      </PageHeader>

      {/* Cost visibility notice */}
      <p className="flex items-start gap-2.5 rounded-card bg-oriel-navy-deep px-4 py-3 text-caption text-oriel-white/85">
        <Lock size={15} strokeWidth={1.5} className="mt-0.5 shrink-0 text-oriel-gold" aria-hidden />
        Dealer cost and margin are shown here for staff only. They never appear on the public site,
        in any page source, or in any API response.
      </p>

      <form action="/admin/products" method="get" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name, brand or model code"
          className="h-11 min-w-48 flex-1 rounded-input border border-oriel-line bg-oriel-white px-3 text-small text-oriel-navy-ink focus:border-oriel-navy focus:outline-none focus:ring-1 focus:ring-oriel-orange-soft"
        />
        <select
          name="category"
          defaultValue={searchParams.category ?? ''}
          className="h-11 rounded-input border border-oriel-line bg-oriel-white px-2 text-small text-oriel-navy-ink focus:border-oriel-navy focus:outline-none focus:ring-1 focus:ring-oriel-orange-soft"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-input border border-oriel-navy bg-oriel-white px-4 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
        >
          Search
        </button>
      </form>

      <FilterChips
        filters={FILTERS}
        active={filter}
        hrefFor={(id) => (id ? `/admin/products?filter=${id}` : '/admin/products')}
      />

      {products.length === 0 && (
        <EmptyState title="No products match" hint="Clear the search or pick another filter." />
      )}

      <ul className="space-y-2">
        {products.slice(0, 100).map((p) => (
          <li
            key={p.slug}
            className="rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest transition-colors hover:border-oriel-navy"
          >
            {/* Stacks on a phone and only becomes two columns once there is
                room for both. The right-hand block used to be shrink-0, which
                sized it to its widest child and pushed the price, the margin
                and half the buttons off the screen edge. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-eyebrow font-medium uppercase text-oriel-slate">{p.brand}</p>
                <p className="text-small font-semibold text-oriel-navy">{p.name}</p>
                <p className="mt-0.5 font-mono text-[0.6875rem] text-oriel-slate">
                  {p.modelCode ?? '—'} · {p.category}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {!p.isPublished && <Pill>Unpublished</Pill>}
                  {p.priceStatus === 'needs_review' && (
                    <Pill tone="gold" className="gap-1">
                      <AlertTriangle size={11} strokeWidth={2} aria-hidden /> Needs review
                    </Pill>
                  )}
                  {p.imageCount === 0 && (
                    <Pill className="gap-1">
                      <ImageOff size={11} strokeWidth={2} aria-hidden /> No imagery
                    </Pill>
                  )}
                  {p.stockStatus === 'out_of_stock' && (
                    <Pill tone="navy" className="gap-1">
                      <PackageX size={11} strokeWidth={2} aria-hidden /> Out of stock
                    </Pill>
                  )}
                  {p.stockQty != null && p.stockStatus !== 'out_of_stock' && (
                    <Pill>{p.stockQty} in stock</Pill>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-auto sm:max-w-[16rem] sm:text-right">
                {/* On a phone the money reads as one line — cost on the left,
                    what it sells for on the right — rather than a right-aligned
                    stack that leaves the row looking half-empty. */}
                <div className="flex items-baseline justify-between gap-3 border-t border-oriel-line pt-3 sm:block sm:border-0 sm:pt-0">
                  <p className="flex items-center gap-1 font-mono text-micro text-oriel-slate sm:justify-end">
                    <Lock size={11} strokeWidth={2} aria-hidden />
                    cost {p.costPrice != null ? formatKes(p.costPrice) : '—'}
                  </p>
                  <div className="text-right">
                    <p className="font-mono text-data font-medium text-oriel-navy-ink">
                      {p.retailPrice != null ? formatKes(p.retailPrice) : 'no price'}
                    </p>
                    {p.marginPercent != null && (
                      <p
                        className={cn(
                          'mt-0.5 font-mono text-micro font-medium',
                          p.marginPercent >= 20 ? 'text-oriel-green-deep' : 'text-oriel-navy-ink'
                        )}
                      >
                        +{p.marginPercent}% · {formatKes(p.marginKes ?? 0)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <ProductActions
                    slug={p.slug}
                    stockStatus={p.stockStatus}
                    isPublished={p.isPublished}
                  />
                </div>
              </div>
            </div>
            {p.pricingNote && (
              <p className="mt-2 rounded-input bg-oriel-gold-soft p-2 text-micro text-oriel-navy-ink">
                {p.pricingNote}
              </p>
            )}
          </li>
        ))}
      </ul>
      {products.length > 100 && (
        <p className="text-small text-oriel-slate">
          Showing the first 100. Narrow the search to see more.
        </p>
      )}
    </div>
  );
}
