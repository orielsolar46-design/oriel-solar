import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { getAllProducts } from '@/lib/catalogue';
import { highlightTerms, rankCategories, rankProducts } from '@/lib/search';
import type { SearchParams } from '@/lib/shop';
import { ProductCard } from '@/components/shop/product-card';
import { SearchHighlight } from '@/components/shop/search-highlight';
import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { CONTACT } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Search products',
  description: 'Search the Oriel Solar catalogue by name, brand, model code or specification.',
  // Internal search results must stay out of the index: Google's own guidance
  // is explicit about it, and an unbounded ?q= space would otherwise generate
  // limitless thin pages competing with the category and product pages that
  // we actually want ranking. Links are still followed so nothing is orphaned.
  robots: { index: false, follow: true },
};

/** What people actually type, offered before they type. */
const POPULAR_SEARCHES = [
  'Bluetti',
  'inverter',
  '5kW',
  'solar panel',
  'flood light',
  'battery',
  'pump',
  'camera',
];

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)?.trim() ?? '';

  const productHits = q ? rankProducts(await getAllProducts(), q) : [];
  const familyHits = q ? rankCategories(q).slice(0, 4) : [];
  const terms = highlightTerms(q);
  const results = productHits.slice(0, 48);

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
            placeholder="Inverter, battery, model code, or “flood light”…"
            autoFocus={!q}
            className="h-12 w-full rounded-input border border-oriel-line pl-10 pr-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
          />
        </div>
        <Button type="submit" size="lg">
          Search
        </Button>
      </form>

      {!q && (
        <div className="mt-8 max-w-2xl">
          <p className="t-eyebrow text-oriel-slate">Start with</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <li key={term}>
                <Link
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex h-10 items-center rounded-pill border border-oriel-line bg-oriel-white px-4 text-small font-medium text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-small text-oriel-slate">
            Search understands names, brands, model codes and specifications, and it copes with
            typing mistakes — &ldquo;invrter&rdquo; still finds the inverters.
          </p>
        </div>
      )}

      {q && (
        <p className="mt-6 text-small text-oriel-slate">
          <span className="font-mono font-medium text-oriel-navy-ink">{productHits.length}</span>{' '}
          {productHits.length === 1 ? 'product' : 'products'} for{' '}
          <span className="font-semibold text-oriel-navy">&ldquo;{q}&rdquo;</span>
        </p>
      )}

      {q && familyHits.length > 0 && (
        <section aria-label="Matching families" className="mt-6">
          <p className="t-eyebrow text-oriel-slate">Families</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {familyHits.map((hit) => (
              <li key={hit.item.href}>
                <Link
                  href={hit.item.href}
                  className="group flex h-full flex-col rounded-card border border-oriel-line bg-oriel-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-oriel-orange hover:shadow-oriel-lift"
                >
                  <span className="text-small font-semibold text-oriel-navy group-hover:text-oriel-orange">
                    <SearchHighlight text={hit.item.name} terms={terms} />
                  </span>
                  <span className="mt-1 text-micro text-oriel-slate">{hit.item.descriptor}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-micro font-semibold text-oriel-orange">
                    Browse
                    <ArrowRight size={13} strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
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
          <ul className="mt-5 flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <li key={term}>
                <Link
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex h-10 items-center rounded-pill border border-oriel-line bg-oriel-white px-4 text-small font-medium text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="whatsapp" className="mt-6">
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={16} />
              Ask us on WhatsApp
            </a>
          </Button>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {results.map((hit) => (
            <ProductCard key={hit.item.slug} product={hit.item} highlight={terms} />
          ))}
        </div>
      )}
    </div>
  );
}
