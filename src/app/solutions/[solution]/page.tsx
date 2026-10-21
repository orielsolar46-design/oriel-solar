import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { SOLUTIONS, getSolution } from '@/lib/content/solutions';
import { filterProducts } from '@/lib/catalogue';
import { PageHero } from '@/components/content/page-hero';
import { FaqList } from '@/components/content/faq-list';
import { ContactBand } from '@/components/layout/contact-band';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ solution: s.slug }));
}

export function generateMetadata({ params }: { params: { solution: string } }): Metadata {
  const solution = getSolution(params.solution);
  if (!solution) return {};
  return {
    title: `${solution.title} in Kenya`,
    description: solution.intro.slice(0, 155),
    alternates: { canonical: `/solutions/${solution.slug}` },
  };
}

export default async function SolutionPage({ params }: { params: { solution: string } }) {
  const solution = getSolution(params.solution);
  if (!solution) notFound();

  const byCategory = await Promise.all(
    solution.productCategories.map(async (category) =>
      (await filterProducts({ category })).filter((p) => p.images.length > 0).slice(0, 2)
    )
  );
  const products = byCategory.flat().slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={solution.eyebrow}
        title={solution.title}
        intro={solution.intro}
        breadcrumbs={[{ label: 'Solutions', href: '/solutions' }, { label: solution.title }]}
      />

      <div className="container-oriel py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="space-y-12">
            {/* Recognition */}
            <section aria-labelledby="for-who">
              <h2 id="for-who" className="t-h2">
                This is for you if
              </h2>
              <ul className="mt-4 max-w-2xl space-y-2.5">
                {solution.forWho.map((item) => (
                  <li key={item} className="flex gap-3 text-body text-oriel-navy-ink">
                    <Check
                      size={18}
                      strokeWidth={2}
                      className="mt-1 shrink-0 text-oriel-green-deep"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* What it does */}
            <section aria-labelledby="what-it-does">
              <h2 id="what-it-does" className="t-h2">
                What the system does
              </h2>
              <div className="mt-5 space-y-6">
                {solution.does.map((block) => (
                  <div key={block.heading} className="max-w-2xl">
                    <h3 className="t-h3">{block.heading}</h3>
                    <p className="mt-2 text-body text-oriel-navy-ink">{block.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Honest limits — this is where trust is built */}
            <section aria-labelledby="limits" className="rounded-card bg-oriel-gold-soft p-6">
              <h2 id="limits" className="t-h3 flex items-center gap-2">
                <AlertTriangle size={20} strokeWidth={1.5} aria-hidden />
                What it will not do
              </h2>
              <ul className="mt-3 space-y-2.5">
                {solution.limits.map((limit) => (
                  <li key={limit} className="flex gap-2.5 text-small text-oriel-navy-ink">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-navy-ink"
                      aria-hidden
                    />
                    {limit}
                  </li>
                ))}
              </ul>
            </section>

            {/* Real products */}
            {products.length > 0 && (
              <section aria-labelledby="kit">
                <h2 id="kit" className="t-h2">
                  Typical kit for this
                </h2>
                <p className="mt-1 text-small text-oriel-slate">
                  We match exact sizes when we quote.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                  {products.map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              </section>
            )}

            <FaqList faqs={solution.faqs} withSchema />
          </div>

          {/* Sticky sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-card bg-oriel-navy-deep p-5">
              <p className="t-eyebrow text-oriel-gold">Start here</p>
              <p className="mt-2 text-body text-oriel-white/85">
                Tell us what you need to run and we will size it.
              </p>
              {/* One button, not two: this slot previously rendered the same
                  Request a quote link twice, stacked. */}
              <Button asChild className="mt-4 w-full">
                <Link href="/request-a-quote">Request a quote</Link>
              </Button>
            </div>

            <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
              <h2 className="t-h3">Shop the parts</h2>
              <ul className="mt-3 space-y-2">
                {solution.shopLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between gap-2 text-small font-medium text-oriel-navy hover:text-oriel-orange"
                    >
                      {link.label}
                      <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <ContactBand />
    </>
  );
}
