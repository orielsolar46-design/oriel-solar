import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SOLUTIONS } from '@/lib/content/solutions';
import { PageHero } from '@/components/content/page-hero';
import { ContactBand } from '@/components/layout/contact-band';

export const metadata: Metadata = {
  title: 'Solar solutions for homes, business and farms in Kenya',
  description:
    'Home backup, full solar homes, commercial systems, solar irrigation and estate lighting — what each one does, what it will not do, and the kit it needs.',
};

export default function SolutionsHub() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Find the system that matches your situation"
        intro="Five common situations — including what each system will not do."
        breadcrumbs={[{ label: 'Solutions' }]}
      />

      <div className="container-oriel py-12">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SOLUTIONS.map((solution) => (
            <Link
              key={solution.slug}
              href={`/solutions/${solution.slug}`}
              className="group rounded-card border border-oriel-line bg-oriel-white p-6 shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
            >
              <p className="t-eyebrow text-oriel-slate">{solution.eyebrow}</p>
              <h2 className="t-h3 mt-2 transition-colors group-hover:text-oriel-orange">
                {solution.title}
              </h2>
              <p className="mt-2 text-small text-oriel-navy-ink">{solution.intro}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-small font-semibold text-oriel-navy">
                Read more
                <ArrowRight
                  size={15}
                  strokeWidth={1.5}
                  className="text-oriel-orange transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <ContactBand />
    </>
  );
}
