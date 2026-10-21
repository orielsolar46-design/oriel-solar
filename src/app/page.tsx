import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts } from '@/lib/content/blog';
import { Hero } from '@/components/home/hero';
import {
  BrandsRow,
  CategoryGrid,
  CategoryShowcase,
  EcoFlowShowcase,
  GreenBand,
  HowBuyingWorks,
  SolutionsBand,
  TrustStrip,
} from '@/components/home/sections';
import { ContactBand } from '@/components/layout/contact-band';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Oriel Solar — Solar panels, batteries & inverters in Kenya',
  description:
    'Tier 1 solar panels, LiFePO4 batteries and hybrid inverters — supplied, sized and installed across Kenya. M-Pesa payment, pay on delivery available.',
};

/**
 * The home page — eleven blocks in order. Recent installations and the guides
 * grid render only when their content exists: projects await
 * {{PROJECT_PHOTOS_AND_DETAILS}}, and the guides grid appears with the blog
 * articles. Nothing is faked in their place.
 *
 * The sizing calculator block was removed at the client's request; the hero
 * and the sidebars now route sizing questions to /request-a-quote instead.
 *
 * Statically rendered and refreshed hourly so the first paint never waits on
 * a database round-trip — this is the page most visitors land on, often on a
 * mid-range Android over patchy 4G.
 */
export const revalidate = 3600;

/**
 * Site name for search results.
 *
 * Google reads `WebSite` to decide the name it prints above the URL in a
 * result, and its guidance is that this belongs on the home page — which is
 * why it lives here and not in the root layout. The trading name leads and
 * the registered name is the alternate, the mirror image of the
 * `Organization` node in the layout, where the legal entity must lead.
 */
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Oriel Solar',
  alternateName: 'Oriel Power Ltd',
  url: SITE_URL,
};

export default async function HomePage() {
  const guides = getPosts().slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      {/* 1 — hero with the arc load sequence */}
      <Hero />

      {/* EcoFlow — first section after hero */}
      <EcoFlowShowcase />

      {/* 2 — category grid */}
      <CategoryGrid />

      {/* 3 — trust strip */}
      <TrustStrip />

      {/* 4 — three buyable products from every stocked family */}
      <CategoryShowcase />

      {/* 5 — solutions band */}
      <SolutionsBand />

      {/* 6 — the green band */}
      <GreenBand />

      {/* 7 — how buying works */}
      <HowBuyingWorks />

      {/* 8 — brands we supply */}
      <BrandsRow />

      {/* 9 — recent installations: hidden until {{PROJECT_PHOTOS_AND_DETAILS}} */}

      {/* 10 — guides */}
      {guides.length > 0 && (
        <section aria-labelledby="guides-heading" className="bg-oriel-white">
          <div className="container-oriel py-16">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="t-eyebrow text-oriel-slate">Guides</p>
                <h2 id="guides-heading" className="t-h2 mt-2">
                  Worth reading before you buy
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-4 hover:text-oriel-orange"
              >
                All guides
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {guides.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group rounded-card border border-oriel-line bg-oriel-white p-6 shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
                >
                  <p className="t-eyebrow text-oriel-slate">{post.category}</p>
                  <h3 className="mt-2 font-display text-[1.0625rem] font-semibold leading-snug text-oriel-navy transition-colors group-hover:text-oriel-orange">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-small text-oriel-navy-ink">{post.description}</p>
                  <p className="mt-3 font-mono text-micro text-oriel-slate">
                    {post.readingMinutes} min read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11 — contact band */}
      <ContactBand />
    </>
  );
}
