import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { ArrowPill } from '@/components/ui/arrow-pill';
import { CATEGORY_CONTENT } from '@/lib/category-content';
import { BLUETTI_FLAGSHIP_SLUGS, filterProducts, sortProducts } from '@/lib/catalogue';
import { PAGE_SIZE, parseShopParams, type SearchParams } from '@/lib/shop';
import { SITE_URL } from '@/lib/site';
import { Pagination } from '@/components/shop/pagination';
import { ProductCard } from '@/components/shop/product-card';
import { Toolbar } from '@/components/shop/toolbar';
import { cn } from '@/lib/utils';

type Props = { params: { category: string }; searchParams: SearchParams };

export function generateMetadata({ params }: Props): Metadata {
  const content = CATEGORY_CONTENT[params.category];
  if (!content) return {};
  return {
    title: content.title,
    description: content.intro.slice(0, 155),
    // Filters live in query strings; the canonical is always the clean path
    // so filtered views do not compete with the category page itself.
    alternates: { canonical: `/shop/${params.category}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const content = CATEGORY_CONTENT[params.category];
  if (!content) notFound();

  const parsed = parseShopParams(searchParams);
  const items = sortProducts(
    await filterProducts({
      category: params.category,
      type: parsed.type,
      brand: parsed.brand,
      phase: parsed.phase,
      availability: parsed.availability,
      minPrice: parsed.minPrice,
      maxPrice: parsed.maxPrice,
    }),
    parsed.sort,
    {
      brandFirst: parsed.brand === 'EcoFlow' || parsed.brand === 'Bluetti',
      pinned: parsed.brand === 'Bluetti' ? BLUETTI_FLAGSHIP_SLUGS : undefined,
    }
  );
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(parsed.page, totalPages);
  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const query: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    query[k] = Array.isArray(v) ? v[0] : v;
  }

  const categoryName = content.title.split(' — ')[0];
  const categoryUrl = `${SITE_URL}/shop/${params.category}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: categoryUrl },
    ],
  };

  // The products actually on this page, in the order they are rendered. This
  // is what tells a crawler the category is a real listing rather than a
  // prose page that happens to link to products.
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: content.title,
    numberOfItems: items.length,
    itemListElement: visible.map((p, index) => ({
      '@type': 'ListItem',
      position: (page - 1) * PAGE_SIZE + index + 1,
      url: `${SITE_URL}/shop/${p.category}/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      {/* Intro band on mist with the quotation push (MASTERPLAN 7.2) */}
      <section className="bg-oriel-mist">
        <div className="container-oriel py-8 lg:py-10">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-oriel-slate">
              <li>
                <Link href="/" className="hover:text-oriel-orange">Home</Link>
              </li>
              <li aria-hidden><ChevronRight size={14} strokeWidth={1.5} /></li>
              <li>
                <Link href="/shop" className="hover:text-oriel-orange">Shop</Link>
              </li>
              <li aria-hidden><ChevronRight size={14} strokeWidth={1.5} /></li>
              <li aria-current="page" className="font-medium text-oriel-navy">
                {content.title.split(' — ')[0]}
              </li>
            </ol>
          </nav>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <h1 className="t-h1 text-oriel-navy">{content.title}</h1>
              <p className="mt-3 max-w-3xl text-body text-oriel-navy-ink">{content.intro}</p>
            </div>
            <aside className="self-start rounded-card bg-oriel-green-soft p-5">
              <p className="t-eyebrow text-oriel-green-deep">Not sure what fits?</p>
              <p className="mt-1.5 text-small text-oriel-navy-ink">
                Tell us what you need to run and an engineer will specify the kit.
              </p>
              <ArrowPill href="/request-a-quote" className="mt-3">
                Request a quote
              </ArrowPill>
            </aside>
          </div>
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
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={`/shop/${params.category}`}
          query={query}
        />
      </section>
    </>
  );
}
