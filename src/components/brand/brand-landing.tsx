import Link from 'next/link';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import type { PublicProduct } from '@/lib/catalogue';
import type { BrandPage } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';
import { CONTACT } from '@/lib/navigation';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { ArrowPill } from '@/components/ui/arrow-pill';
import { VerifiedBadge } from '@/components/brand/verified-badge';
import { ContactBand } from '@/components/layout/contact-band';

/**
 * A brand landing page.
 *
 * The page exists for the search "ecoflow kenya" and "bluetti ac500 price",
 * so it carries the things a buyer (and a crawler) needs: the range, the
 * price band, the proof of channel, the questions, and the route to buy.
 * The same content is published as structured data, so a search engine or an
 * AI assistant reading the page gets the facts in one pass.
 */
export function BrandLanding({
  config,
  products,
  allCount,
}: {
  config: BrandPage;
  products: PublicProduct[];
  allCount: number;
}) {
  const url = `${SITE_URL}/${config.slug}`;
  const listed = products.map((p) => ({
    '@type': 'ListItem',
    position: products.indexOf(p) + 1,
    name: p.name,
    url: `${SITE_URL}/shop/${p.category}/${p.slug}`,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: config.heroTitle,
        description: config.metaDescription,
        inLanguage: 'en-KE',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@type': 'Brand', name: config.brand },
        mainEntity: { '@type': 'ItemList', numberOfItems: products.length, itemListElement: listed },
      },
      {
        '@type': 'Brand',
        '@id': `${url}#brand`,
        name: config.brand,
        description: `${config.brand} products supplied, sized and installed in Kenya by ${config.badge}.`,
        url,
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Oriel Power Ltd',
        alternateName: 'Oriel Solar',
        url: SITE_URL,
        description: `Oriel Power Ltd (Oriel Solar) is a ${config.badge} in Kenya, supplying, sizing and installing ${config.brand} equipment across the country.`,
        email: CONTACT.email,
        telephone: CONTACT.phonePrimaryTel,
        areaServed: { '@type': 'Country', name: 'Kenya' },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: CONTACT.phonePrimaryTel,
          contactType: 'sales',
          areaServed: 'KE',
          availableLanguage: ['en', 'sw'],
        },
        makesOffer: {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `${config.brand} supply, sizing and installation in Kenya`,
          },
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: config.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: config.brand, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-oriel-mist">
        <div className="container-oriel py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-caption text-oriel-slate">
            <Link href="/" className="hover:text-oriel-orange">
              Home
            </Link>{' '}
            / <span className="text-oriel-navy">{config.brand}</span>
          </nav>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
            <div>
              <VerifiedBadge label={config.badge} tone="dark" />
              <h1 className="t-h1 mt-4 text-oriel-navy">{config.heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-body-lg text-oriel-navy-ink">{config.intro}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <ArrowPill href={config.shopHref}>
                  Shop all {config.brand}
                </ArrowPill>
                <Button asChild variant="outline" size="lg">
                  <Link href="/request-a-quote">Request a quote</Link>
                </Button>
              </div>
              <dl className="mt-8 grid max-w-xl grid-cols-3 gap-4">
                <div>
                  <dt className="font-mono text-h3 font-medium text-oriel-navy-ink">{allCount}</dt>
                  <dd className="text-caption text-oriel-slate">
                    {config.brand} products in stock
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-h3 font-medium text-oriel-navy-ink">24h</dt>
                  <dd className="text-caption text-oriel-slate">Nairobi next-day delivery</dd>
                </div>
                <div>
                  <dt className="font-mono text-h3 font-medium text-oriel-navy-ink">M-PESA</dt>
                  <dd className="text-caption text-oriel-slate">Pay on delivery</dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-card border border-oriel-line bg-oriel-white p-6">
              <p className="t-eyebrow text-oriel-slate">What the badge means</p>
              <p className="mt-2 text-small text-oriel-navy-ink">{config.badgeNote}</p>
              <ul className="mt-4 space-y-2">
                {config.highlights.map((h) => (
                  <li key={h.heading} className="flex gap-2 text-small text-oriel-navy-ink">
                    <BadgeCheck
                      size={16}
                      strokeWidth={1.5}
                      className="mt-0.5 shrink-0 text-oriel-green"
                      aria-hidden
                    />
                    <span>
                      <span className="font-semibold">{h.heading}.</span> {h.body}
                    </span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* Range */}
      {products.length > 0 && (
        <section aria-labelledby={`${config.slug}-range`} className="container-oriel py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="t-eyebrow text-oriel-slate">The range</p>
              <h2 id={`${config.slug}-range`} className="t-h2 mt-2">
                {config.brand} flagships, ready to install
              </h2>
            </div>
            <Link
              href={config.shopHref}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-4 hover:text-oriel-orange"
            >
              All {allCount} {config.brand} products
              <ArrowRight size={15} strokeWidth={2} aria-hidden />
            </Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Families */}
      <section aria-labelledby={`${config.slug}-families`} className="border-t border-oriel-line bg-oriel-white">
        <div className="container-oriel py-14">
          <h2 id={`${config.slug}-families`} className="t-h2">
            What {config.brand} fits into your system
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {config.families.map((family) => (
              <li key={family.label}>
                <Link
                  href={family.href}
                  className="group flex h-full flex-col rounded-card border border-oriel-line bg-oriel-mist p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-oriel-orange hover:shadow-oriel-lift"
                >
                  <span className="text-small font-semibold text-oriel-navy group-hover:text-oriel-orange">
                    {family.label}
                  </span>
                  <span className="mt-1.5 text-small text-oriel-slate">{family.body}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-oriel-orange">
                    Browse
                    <ArrowRight size={13} strokeWidth={2} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Questions */}
      <section aria-labelledby={`${config.slug}-faq`} className="border-t border-oriel-line bg-oriel-mist">
        <div className="container-oriel py-14">
          <div className="max-w-3xl">
            <h2 id={`${config.slug}-faq`} className="t-h2">
              {config.brand} questions, answered
            </h2>
            <div className="mt-8 space-y-3">
              {config.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-card border border-oriel-line bg-oriel-white p-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-small font-semibold text-oriel-navy">
                    {faq.question}
                    <span
                      className="shrink-0 text-oriel-orange transition-transform duration-200 group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-small text-oriel-navy-ink">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
