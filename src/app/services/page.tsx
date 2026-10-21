import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardCheck, Hammer, LifeBuoy, TrendingUp } from 'lucide-react';
import { PageHero } from '@/components/content/page-hero';
import { FaqList } from '@/components/content/faq-list';
import { ContactBand } from '@/components/layout/contact-band';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Solar installation and maintenance services in Kenya',
  description:
    'Site survey, professional installation, servicing and system upgrades across Kenya — from the company that supplied the equipment.',
};

const SERVICES = [
  {
    icon: ClipboardCheck,
    title: 'Site survey',
    lead: 'Before anything is specified.',
    body: 'An engineer measures the site, checks shading and goes through your usage.',
    points: [
      'Roof area, orientation and shading',
      'Load profile from your bills',
      'Cable routes and earthing inspected',
      'Itemised written quotation',
    ],
  },
  {
    icon: Hammer,
    title: 'Installation',
    lead: 'Fitted properly, first time.',
    body: 'Mounting, wiring, protection, commissioning, handover. We install what we supply.',
    points: [
      'Correct fixings for your roof type',
      'DC and AC protection sized to the array',
      'Commissioned, tested, documented',
      'You are shown what to do in a fault',
    ],
  },
  {
    icon: LifeBuoy,
    title: 'Maintenance and support',
    lead: 'Low-maintenance, not no-maintenance.',
    body: 'Dust costs output, connections loosen, batteries report their health.',
    points: [
      'Panel cleaning and visual inspection',
      'Connection, protection and earthing checks',
      'Battery health and inverter fault log reviewed',
      'Remote monitoring where supported',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Upgrades and expansion',
    lead: 'Add capacity as your needs grow.',
    body: 'Our designs leave room to grow, and we extend systems from elsewhere.',
    points: [
      'Extra panels or battery modules',
      'Inverter replacement where it limits growth',
      'Assessment of systems installed by others',
      'Generator integration with a hybrid inverter',
    ],
  },
];

const FAQS = [
  {
    question: 'Do I have to buy the equipment from you to get it installed?',
    answer:
      'Not necessarily, but one supplier means one route for a warranty claim.',
  },
  {
    question: 'How long does an installation take?',
    answer:
      'Backup: about a day. Full solar with storage: one to two. Commercial: after the survey.',
  },
  {
    question: 'What does installation cost?',
    answer:
      'Installation is quoted per job after a site survey, because the cost depends on the roof, the cable runs and access. Confirmed in writing before work is booked.',
  },
  {
    question: 'Do you work outside Nairobi?',
    answer:
      'Yes, nationwide. Travel to distant sites is quoted openly.',
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Survey, installation, servicing and upgrades"
        intro="A design that matches your site, installed properly."
        breadcrumbs={[{ label: 'Services' }]}
      />

      <div className="container-oriel py-12">
        <div className="space-y-12">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <section key={service.title} className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <div>
                  <Icon size={28} strokeWidth={1.5} className="text-oriel-navy" aria-hidden />
                  <h2 className="t-h3 mt-3">{service.title}</h2>
                  <p className="mt-1 text-small font-medium text-oriel-orange">{service.lead}</p>
                </div>
                <div className="max-w-2xl">
                  <p className="text-body text-oriel-navy-ink">{service.body}</p>
                  <ul className="mt-4 space-y-2">
                    {service.points.map((point) => (
                      <li key={point} className="flex gap-2.5 text-small text-oriel-navy-ink">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange"
                          aria-hidden
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-14 rounded-card bg-oriel-green-soft p-6 text-center lg:p-8">
          <h2 className="t-h3">Start with a survey</h2>
          <p className="mx-auto mt-2 max-w-xl text-body text-oriel-navy-ink">
            An engineer confirms what is possible before you spend.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/request-a-quote">Book a site survey</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/shop">Browse the catalogue</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14">
          <FaqList faqs={FAQS} withSchema />
        </div>
      </div>

      <ContactBand />
    </>
  );
}
