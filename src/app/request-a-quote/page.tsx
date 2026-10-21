import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WhatsAppIcon } from '@/components/ui/brand-icons';
import { PageHero } from '@/components/content/page-hero';
import { QuoteForm } from '@/components/content/quote-form';
import { CONTACT } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Request a quote or book a site survey',
  description:
    'For larger and custom solar systems: tell us about your site and usage and an engineer will send a written quotation.',
};

export default function RequestQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Quotations"
        title="Request a quote or book a survey"
        intro="Larger systems, commercial sites and anything custom — an engineer designs and prices it."
        breadcrumbs={[{ label: 'Request a quote' }]}
      />

      <div className="container-oriel py-12">
        {/* The form is the page. Everything else earns its place by answering a
            question a buyer actually has before filling it in — is this for me,
            and what happens after I press send. */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,460px)_1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-card border border-oriel-line bg-oriel-white p-6 shadow-oriel-rest">
              <h2 className="t-h3">Tell us about your site</h2>
              <p className="mt-1 text-small text-oriel-slate">
                The more detail you give, the more accurate the quotation.
              </p>
              <div className="mt-5">
                <Suspense fallback={<div className="h-96" />}>
                  <QuoteForm kind="quote" />
                </Suspense>
              </div>
            </div>
          </div>

          <div className="max-w-xl space-y-10">
            <section>
              <h2 className="t-h3">Quote us for</h2>
              <ul className="mt-3 space-y-2">
                {[
                  'Systems above KES 500,000',
                  'Commercial and industrial sites',
                  'Three-phase and heavy motor loads',
                  'Solar pumping and estate lighting',
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-body text-oriel-navy-ink">
                    <span
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="t-h3">What happens next</h2>
              <ol className="mt-3 space-y-3">
                {[
                  'An engineer reads it and prices what can be priced.',
                  'We call you about the two or three things the form did not ask.',
                  'For larger jobs we come and measure rather than assume.',
                  'You get an itemised written quotation.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-body text-oriel-navy-ink">
                    <span className="mt-px font-mono text-small font-medium text-oriel-navy">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-card bg-oriel-green-soft p-5">
              <p className="text-body text-oriel-navy-ink">
                In a hurry? Call{' '}
                <span className="font-mono font-medium">{CONTACT.phonePrimary}</span>. A photo of
                your switchboard, roof or borehole head says more than a form can ask.
              </p>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-input border border-oriel-green-deep px-5 py-2.5 text-small font-semibold text-oriel-green-deep transition-colors hover:bg-oriel-white"
              >
                <WhatsAppIcon size={16} /> Send details on WhatsApp
              </a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
