import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { filterProducts, sortProducts } from '@/lib/catalogue';
import type { SearchParams } from '@/lib/shop';
import { ProductCard } from '@/components/shop/product-card';

export const metadata: Metadata = {
  title: 'Search products',
  description: 'Search the Oriel Solar catalogue by name, brand, model code or specification.',
  // Internal search results must stay out of the index: Google's own guidance
  // is explicit about it, and an unbounded ?q= space would otherwise generate
  // limitless thin pages competing with the category and product pages that
  // we actually want ranking. Links are still followed so nothing is orphaned.
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)?.trim() ?? '';
  const results = q ? sortProducts(await filterProducts({ q }), 'relevance') : [];

  return (
    <div className="container-oriel py-10">
      <h1 className="t-h1 text-oriel-navy">Search</h1>

      <form action="/search" method="get" role="search" className="mt-5 flex max-w-xl gap-2">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <div className="relative flex-1">
          <Search
            size={18}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-oriel-slate"
            aria-hidden
          />
          <input
            id="site-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Inverter, battery, model code…"
            autoFocus={!q}
            className="h-12 w-full rounded-input border border-oriel-line pl-10 pr-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-input bg-oriel-orange px-6 font-sans font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
        >
          Search
        </button>
      </form>

      {q && (
        <p className="mt-6 text-small text-oriel-slate">
          <span className="font-mono font-medium text-oriel-navy-ink">{results.length}</span>{' '}
          {results.length === 1 ? 'result' : 'results'} for{' '}
          <span className="font-semibold text-oriel-navy">&ldquo;{q}&rdquo;</span>
        </p>
      )}

      {q && results.length === 0 && (
        <div className="mt-6 max-w-xl rounded-card border border-oriel-line bg-oriel-mist p-8">
          <p className="text-body text-oriel-navy-ink">
            Nothing matches &ldquo;{q}&rdquo;.
          </p>
          <p className="mt-1 text-small text-oriel-slate">
            Try the brand name, the model code, or a capacity like &ldquo;5kW&rdquo; — or ask us on
            WhatsApp and we&apos;ll point you to the right product.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {results.slice(0, 48).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
