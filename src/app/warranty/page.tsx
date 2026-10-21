import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';
import { PageHero } from '@/components/content/page-hero';
import { FaqList } from '@/components/content/faq-list';
import { ContactBand } from '@/components/layout/contact-band';
import { QuoteForm } from '@/components/content/quote-form';

export const metadata: Metadata = {
  title: 'Warranty registration and terms',
  description:
    'Register your Oriel Solar system for warranty, and read what the manufacturer warranty covers and excludes.',
};

const COVERED = [
  'Manufacturing defects in materials and workmanship',
  'Inverter failure within the warranty period',
  'Battery capacity below the stated retention threshold',
  'Panel output below the performance guarantee',
];

const NOT_COVERED = [
  'Incorrect installation or wiring by a third party',
  'Surge damage where no surge protection was fitted',
  'Water ingress where equipment was not rated for the location',
  'Physical damage after delivery was accepted',
  'Repair or opening by anyone the manufacturer has not authorised',
  'Over-discharge from a mismatched or misconfigured inverter',
];

const FAQS = [
  {
    question: 'Do I have to register to be covered?',
    answer:
      'No — cover exists from purchase. Registering just makes a claim faster.',
  },
  {
    question: 'What do I need to make a claim?',
    answer:
      'Order number, serial number, and what the equipment is doing. Photos often avoid a site visit.',
  },
  {
    question: 'Does the warranty transfer if I sell the property?',
    answer:
      'Usually yes — warranties attach to the equipment, not the owner.',
  },
  {
    question: 'How long do the different products carry?',
    answer:
      'On each product page. Typically 5 years for inverters and batteries, 2 for street lights.',
  },
];

export default function WarrantyPage() {
  return (
    <>
      <PageHero
        eyebrow="Warranty"
        title="Warranty registration and terms"
        intro="What is covered, what is not, and how to claim."
        breadcrumbs={[{ label: 'Warranty' }]}
      />

      <div className="container-oriel py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <div className="stack-sections max-w-2xl">
            <section>
              <h2 className="t-h2 flex items-center gap-2">
                <ShieldCheck size={24} strokeWidth={1.5} aria-hidden />
                What the warranty covers
              </h2>
              <p className="mt-3 text-body text-oriel-navy-ink">
                The warranty period is stated on each product page. To make a claim, contact
                us with your order number and we will confirm what happens next.
              </p>
              <ul className="mt-5 space-y-2.5">
                {COVERED.map((item) => (
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

            <section>
              <h2 className="t-h2">What it does not cover</h2>
              <p className="mt-3 text-body text-oriel-navy-ink">
                Standard across manufacturers, listed so there are no surprises.
              </p>
              <ul className="mt-5 space-y-2.5">
                {NOT_COVERED.map((item) => (
                  <li key={item} className="flex gap-3 text-body text-oriel-navy-ink">
                    <X size={18} strokeWidth={2} className="mt-1 shrink-0 text-oriel-slate" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-card bg-oriel-gold-soft p-4 text-small text-oriel-navy-ink">
                The two most common refusals: surge damage with no DC surge protection, and battery
                damage from an inverter set for the wrong battery type.
              </p>
            </section>

            <section>
              <h2 className="t-h2">Making a claim</h2>
              <ol className="mt-4 space-y-3">
                {[
                  'Contact us with your order number and the fault.',
                  'Send photographs or a short video.',
                  'We check for configuration faults first.',
                  'We arrange repair or replacement.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-body text-oriel-navy-ink">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-oriel-gold-soft font-mono text-micro font-medium text-oriel-navy-ink">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-small text-oriel-slate">
                Full terms are set out in our{' '}
                <Link
                  href="/legal/terms"
                  className="font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2"
                >
                  terms of sale
                </Link>
                .
              </p>
            </section>

            <FaqList faqs={FAQS} withSchema />
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-card border border-oriel-line bg-oriel-white p-6">
              <h2 className="t-h3">Register your system</h2>
              <p className="mt-2 text-small text-oriel-navy-ink">
                Send your order and serial numbers and we will hold them on file.
              </p>
              <div className="mt-4">
                <Suspense fallback={<div className="h-96" />}>
                  <QuoteForm kind="warranty" />
                </Suspense>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ContactBand />
    </>
  );
}
