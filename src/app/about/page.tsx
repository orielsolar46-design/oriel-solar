import type { Metadata } from 'next';
import Link from 'next/link';
import { Award, Leaf, Sun } from 'lucide-react';
import { PageHero } from '@/components/content/page-hero';
import { ContactBand } from '@/components/layout/contact-band';
import { CONTACT } from '@/lib/navigation';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  // `absolute` suppresses the root template. This title already names the
  // business, and without it the tab read "About Oriel Solar … · Oriel Solar".
  title: { absolute: 'About Oriel Solar — solar supply and installation in Kenya' },
  description:
    'Oriel Solar supplies, sizes and installs solar panels, lithium storage and inverters across Kenya. Clean energy, more savings, brighter tomorrow.',
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="We sell solar the way an engineer would buy it"
        intro="Oriel Power Ltd supplies, sizes and installs solar equipment across Kenya."
        breadcrumbs={[{ label: 'About' }]}
      />

      <div className="container-oriel py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="stack-sections max-w-2xl">
            <section>
              <h2 className="t-h2">How we work</h2>
              <div className="mt-4 space-y-4 text-body text-oriel-navy-ink">
                <p>
                  Most solar disappointment comes from a system sized without asking what you
                  actually run. So we publish full specifications, show the price you actually
                  pay, and state every sizing assumption.
                </p>
                <p>An engineer answers the phone and WhatsApp — before you spend, not after.</p>
              </div>
            </section>

            <section>
              <h2 className="t-h2">What we supply</h2>
              <div className="mt-4 space-y-4 text-body text-oriel-navy-ink">
                <p>
                  Tier 1 panels, LiFePO4 storage, hybrid, off-grid and grid-tied inverters, water
                  heaters, street lighting, solar pumping, water treatment and balance-of-system
                  hardware.
                </p>
                <p>
                  Brands with real manufacturer backing — Jinko, Livoltek, Solis, Growatt, Deye,
                  Victron, Lorentz, Hanti.
                </p>
              </div>
            </section>

            <section>
              <h2 className="t-h2">Our three pillars</h2>
              <div className="mt-5 space-y-5">
                {[
                  {
                    icon: Award,
                    title: 'Premium Quality',
                    body: 'Genuine Tier 1 stock, specifications published.',
                    green: false,
                  },
                  {
                    icon: Leaf,
                    title: 'Sustainable Solutions',
                    body: 'Displaces grid carbon or diesel, and pays the owner back.',
                    green: true,
                  },
                  {
                    icon: Sun,
                    title: 'Powering a Cleaner Future',
                    body: 'Homes, farms, schools, clinics and businesses across Kenya.',
                    green: false,
                  },
                ].map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.title} className="flex gap-4">
                      <Icon
                        size={22}
                        strokeWidth={1.5}
                        className={`mt-1 shrink-0 ${pillar.green ? 'text-oriel-green' : 'text-oriel-navy'}`}
                        aria-hidden
                      />
                      <div>
                        <h3 className="t-h3">{pillar.title}</h3>
                        <p className="mt-1 text-body text-oriel-navy-ink">{pillar.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
              <h2 className="t-h3">Talk to us</h2>
              <p className="mt-2 text-small text-oriel-navy-ink">
                Sizing, pairing and delivery — answered by someone who knows the equipment.
              </p>
              <a
                href={`tel:${CONTACT.phonePrimaryTel}`}
                className="mt-3 block font-mono text-h3 font-medium text-oriel-navy hover:underline"
              >
                {CONTACT.phonePrimary}
              </a>
              <p className="font-mono text-small text-oriel-slate">{CONTACT.phoneSecondary}</p>
              <Button asChild variant="whatsapp" className="mt-4 w-full">
                <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                  Chat on WhatsApp
                </a>
              </Button>
            </div>
            <div className="rounded-card bg-oriel-navy-deep p-5">
              <p className="t-eyebrow text-oriel-gold">Where we are</p>
              <p className="mt-2 text-body text-oriel-white/85">
                {CONTACT.location}. Nationwide delivery and installation.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-block text-small font-semibold text-oriel-gold hover:underline"
              >
                Contact details →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <ContactBand />
    </>
  );
}
