import type { Metadata } from 'next';
import { Phone } from 'lucide-react';
import { GmailIcon, LocationIcon, WhatsAppIcon } from '@/components/ui/brand-icons';
import { PageHero } from '@/components/content/page-hero';
import { CallbackForm } from '@/components/layout/callback-form';
import { CONTACT } from '@/lib/navigation';

export const metadata: Metadata = {
  // `absolute` suppresses the root template, which would otherwise repeat the
  // name: "Contact Oriel Solar — Nairobi, Kenya · Oriel Solar".
  title: { absolute: 'Contact Oriel Solar — Nairobi, Kenya' },
  description:
    'Call 0723 204 342, WhatsApp us, or request a call back. Solar supply, sizing and installation across Kenya.',
};

export default function ContactPage() {
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Oriel Power Ltd',
    alternateName: 'Oriel Solar',
    description:
      'Supplier and installer of solar panels, lithium battery storage, inverters, solar water heaters, street lighting and solar pumping across Kenya.',
    telephone: [`+${CONTACT.phonePrimaryTel.replace(/\D/g, '')}`],
    email: CONTACT.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    areaServed: 'KE',
    currenciesAccepted: 'KES',
    paymentAccepted: 'M-Pesa',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />

      <PageHero
        eyebrow="Contact"
        title="Talk to someone who knows the equipment"
        intro="Sizing, pairing, delivery, installation — ask before you spend."
        breadcrumbs={[{ label: 'Contact' }]}
      />

      <div className="container-oriel py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">
            <div className="rounded-card border border-oriel-line bg-oriel-white p-6">
              <h2 className="t-h3">Call us</h2>
              <a
                href={`tel:${CONTACT.phonePrimaryTel}`}
                className="mt-2 flex items-center gap-3 font-mono text-h2 font-medium text-oriel-navy hover:underline"
              >
                <Phone size={26} strokeWidth={1.5} aria-hidden />
                {CONTACT.phonePrimary}
              </a>
              <a
                href={`tel:${CONTACT.phoneSecondaryTel}`}
                className="mt-1 block font-mono text-body text-oriel-slate hover:text-oriel-navy"
              >
                {CONTACT.phoneSecondary}
              </a>
            </div>

            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-card bg-oriel-green p-6 text-oriel-white transition-colors hover:bg-oriel-green-deep"
            >
              <WhatsAppIcon size={26} />
              <span>
                <span className="block font-display text-[1.0625rem] font-semibold">
                  Chat on WhatsApp
                </span>
                <span className="text-small text-oriel-white/85">
                  Send a photo of your switchboard or meter and we can help faster
                </span>
              </span>
            </a>

            <div className="rounded-card border border-oriel-line bg-oriel-white p-6">
              <dl className="space-y-4 text-small">
                <div className="flex gap-3">
                  <dt className="sr-only">Email</dt>
                  <GmailIcon size={18} className="mt-0.5 shrink-0" />
                  <dd>
                    <a href={`mailto:${CONTACT.email}`} className="text-oriel-navy hover:text-oriel-orange">
                      {CONTACT.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="sr-only">Address</dt>
                  <LocationIcon size={20} className="mt-0.5 shrink-0" />
                  <dd className="text-oriel-navy-ink">
                    {CONTACT.location}
                    <span className="mt-0.5 block text-oriel-slate">
                      Nationwide delivery · installation across Kenya
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <CallbackForm />
            <p className="mt-4 text-small text-oriel-slate">
              Prefer a written quotation for a larger or custom system?{' '}
              <a
                href="/request-a-quote"
                className="font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2"
              >
                Request a quote
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
