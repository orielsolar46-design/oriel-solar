import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { SunArc } from '@/components/brand/sun-arc';
import {
  DeliveryIcon,
  GmailIcon,
  LocationIcon,
  MpesaMark,
  WhatsAppBadge,
  WhatsAppIcon,
} from '@/components/ui/brand-icons';
import { Check, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Style guide',
  robots: { index: false, follow: false },
};

const COLOURS: { name: string; token: string; hex: string; role: string; text?: string }[] = [
  { name: 'Navy', token: 'oriel-navy', hex: '#0B2A6B', role: 'Primary brand · structure', text: 'text-white' },
  { name: 'Navy deep', token: 'oriel-navy-deep', hex: '#061A46', role: 'Deepest surface', text: 'text-white' },
  { name: 'Navy ink', token: 'oriel-navy-ink', hex: '#0A1733', role: 'Body copy on light', text: 'text-white' },
  { name: 'Orange', token: 'oriel-orange', hex: '#F26A21', role: 'Primary action', text: 'text-white' },
  { name: 'Orange deep', token: 'oriel-orange-deep', hex: '#D9541A', role: 'Action hover/pressed', text: 'text-white' },
  { name: 'Orange soft', token: 'oriel-orange-soft', hex: '#FDEEE6', role: 'Selected cards · active chips' },
  { name: 'Gold', token: 'oriel-gold', hex: '#FDB913', role: 'The sun · badges · step numbers' },
  { name: 'Gold soft', token: 'oriel-gold-soft', hex: '#FFF6E0', role: 'Pay-on-delivery panels · warnings' },
  { name: 'Green', token: 'oriel-green', hex: '#3FA535', role: 'Secondary brand · savings · WhatsApp', text: 'text-white' },
  { name: 'Green deep', token: 'oriel-green-deep', hex: '#2E7D28', role: 'Green sections with body copy', text: 'text-white' },
  { name: 'Green soft', token: 'oriel-green-soft', hex: '#EAF6E8', role: 'Savings panels · in-stock tints' },
  { name: 'White', token: 'oriel-white', hex: '#FFFFFF', role: 'Base surface' },
  { name: 'Mist', token: 'oriel-mist', hex: '#F4F6FB', role: 'Section alternator' },
  { name: 'Line', token: 'oriel-line', hex: '#DCE3F0', role: 'Hairlines · borders' },
  { name: 'Slate', token: 'oriel-slate', hex: '#5A6784', role: 'Secondary text', text: 'text-white' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-oriel-line py-12">
      <h2 className="t-h2 mb-8">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="container-oriel py-12">
      <p className="t-eyebrow text-oriel-orange">Oriel Power Ltd</p>
      <h1 className="t-h1 mt-2">Design system & style guide</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-oriel-slate">
        The complete token system — colour, typography, buttons, forms, elevation and the
        sun-arc motif. Every colour on the site derives from this palette; nothing outside
        it may appear anywhere in the interface.
      </p>

      {/* COLOUR */}
      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {COLOURS.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-card border border-oriel-line shadow-oriel-rest">
              <div className={`flex h-24 items-end p-3 ${c.text ?? 'text-oriel-navy-ink'}`} style={{ backgroundColor: c.hex }}>
                <span className="font-mono text-small">{c.hex}</span>
              </div>
              <div className="bg-oriel-white p-3">
                <p className="font-display text-body font-semibold text-oriel-navy">{c.name}</p>
                <p className="font-mono text-micro text-oriel-slate">--{c.token}</p>
                <p className="mt-1 text-small text-oriel-slate">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-card border border-oriel-line p-5">
          <p className="t-eyebrow">Signature gradient — sun motif only</p>
          <div className="mt-3 h-16 rounded-input bg-sun-arc" />
          <p className="mt-2 font-mono text-small text-oriel-slate">
            linear-gradient(180deg, #FDB913 0%, #F26A21 100%)
          </p>
        </div>

        {/* The division of labour (MASTERPLAN V2 2.2) */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card bg-oriel-navy p-5">
            <p className="font-display text-body font-semibold text-oriel-white">Navy</p>
            <p className="mt-1 text-small text-oriel-white/80">builds the structure.</p>
          </div>
          <div className="rounded-card bg-oriel-orange p-5">
            <p className="font-display text-body font-semibold text-oriel-white">Orange</p>
            <p className="mt-1 text-small text-oriel-white/90">drives the sale.</p>
          </div>
          <div className="rounded-card bg-oriel-green-deep p-5">
            <p className="font-display text-body font-semibold text-oriel-white">Green</p>
            <p className="mt-1 text-small text-oriel-white/90">
              carries the savings and the conversation.
            </p>
          </div>
          <div className="rounded-card bg-oriel-gold p-5">
            <p className="font-display text-body font-semibold text-oriel-navy-ink">Gold</p>
            <p className="mt-1 text-small text-oriel-navy-ink">is the sun.</p>
          </div>
        </div>

        <div className="mt-6 rounded-card bg-oriel-green-soft p-5">
          <p className="t-eyebrow text-oriel-green-deep">Green in use</p>
          <p className="mt-2 text-body text-oriel-navy-ink">
            Estimated monthly saving:{' '}
            <span className="font-mono font-semibold text-oriel-green-deep">KES 8,400</span>{' '}
            · Payback:{' '}
            <span className="font-mono font-semibold text-oriel-green-deep">4.2 years</span>
          </p>
          <p className="mt-1 text-small text-oriel-slate">
            Every savings figure is green, everywhere it appears. Green never sits on a
            primary commerce button.
          </p>
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section title="Typography">
        <div className="space-y-6">
          <div>
            <p className="t-eyebrow mb-1">Display · Public Sans 700</p>
            <p className="t-display">Brighter tomorrow</p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">H1 · Public Sans 700</p>
            <p className="t-h1">Power that doesn&apos;t ask permission</p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">H2 · Public Sans 600</p>
            <p className="t-h2">Size your system in two minutes</p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">H3 · Public Sans 600</p>
            <p className="t-h3">Hybrid inverters, 3kW to 125kW</p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">Body large · Public Sans 400</p>
            <p className="text-body-lg text-oriel-navy-ink">
              This inverter runs a three-bedroom home through a blackout. Numbers over
              adjectives — every claim carries a figure.
            </p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">Body · Public Sans 400</p>
            <p className="text-body text-oriel-navy-ink">
              Public Sans gives engineering-document clarity and reads cleanly at small
              sizes on a mid-range Android phone.
            </p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">Data · IBM Plex Mono 500</p>
            <p className="t-data text-oriel-navy-ink">
              5.12 kWh · 51.2 V · 100 Ah · KES 96,400 · ORL-2607-00184
            </p>
          </div>
          <div>
            <p className="t-eyebrow mb-1">Eyebrow · Public Sans 600 uppercase</p>
            <p className="t-eyebrow">Not sure what you need?</p>
          </div>
        </div>
      </Section>

      {/* BRAND MARKS */}
      <Section title="Third-party brand marks">
        <p className="mb-6 max-w-2xl text-small text-oriel-slate">
          The five services Oriel points a customer at. All inline SVG, no image
          requests, no white box on the navy. Marks that meet both surfaces take
          a <code className="font-mono">tone</code>; the rest are fixed colour.
          Use a mark where the service is being named as a payment method or a
          destination — keep it as words in running prose, FAQ answers and legal
          copy.
        </p>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-card border border-oriel-line p-5">
            <span className="flex flex-col items-start gap-2">
              <MpesaMark height={22} />
              <span className="font-mono text-micro text-oriel-slate">MpesaMark</span>
            </span>
            <span className="flex flex-col items-start gap-2">
              <DeliveryIcon size={24} />
              <span className="font-mono text-micro text-oriel-slate">DeliveryIcon</span>
            </span>
            <span className="flex flex-col items-start gap-2">
              <LocationIcon size={26} />
              <span className="font-mono text-micro text-oriel-slate">LocationIcon</span>
            </span>
            <span className="flex flex-col items-start gap-2">
              <GmailIcon size={22} />
              <span className="font-mono text-micro text-oriel-slate">GmailIcon</span>
            </span>
            <span className="flex flex-col items-start gap-2">
              <WhatsAppBadge size={26} />
              <span className="font-mono text-micro text-oriel-slate">WhatsAppBadge</span>
            </span>
            <span className="flex flex-col items-start gap-2">
              <WhatsAppIcon size={24} className="text-oriel-green-deep" />
              <span className="font-mono text-micro text-oriel-slate">WhatsAppIcon</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-6 rounded-card bg-oriel-navy-deep p-5">
            <p className="t-eyebrow w-full text-oriel-white/60">tone=&quot;dark&quot;</p>
            <MpesaMark height={22} tone="dark" />
            <DeliveryIcon size={24} tone="dark" />
            <LocationIcon size={26} tone="dark" />
            <GmailIcon size={22} />
            <WhatsAppIcon size={24} className="text-oriel-green" />
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-4 rounded-card border border-oriel-line p-5 text-oriel-orange">
            <p className="t-eyebrow w-full text-oriel-slate">
              tone=&quot;mono&quot; — inherits currentColor for UI that carries an active state
            </p>
            <DeliveryIcon size={24} tone="mono" />
            <LocationIcon size={26} tone="mono" />
          </div>

          <div className="rounded-card border border-oriel-line p-5">
            <p className="t-eyebrow mb-3">At the sizes they actually run</p>
            <p className="text-small text-oriel-navy-ink">
              Pay now with <MpesaMark height={15} /> · <DeliveryIcon size={14} />{' '}
              Nationwide delivery · <LocationIcon size={15} /> Nairobi ·{' '}
              <GmailIcon size={14} /> orielpowerdm@gmail.com
            </p>
          </div>
        </div>
      </Section>

      {/* BUTTONS */}
      <Section title="Buttons">
        <div className="space-y-8">
          <div>
            <p className="t-eyebrow mb-3">Variants</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Add to basket</Button>
              <Button variant="outline">Request a quote</Button>
              <Button variant="confirm">Order confirmed</Button>
              <Button variant="whatsapp">Talk to an engineer</Button>
              <Button variant="ghost">Learn more</Button>
              <Button variant="destructive">Remove from cart</Button>
            </div>
          </div>
          <div className="rounded-card bg-oriel-navy-deep p-5">
            <p className="t-eyebrow mb-3 text-oriel-white/60">On dark</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Shop products</Button>
              <Button variant="outline-light">Request a quote</Button>
            </div>
          </div>
          <div>
            <p className="t-eyebrow mb-3">Sizes</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div>
            <p className="t-eyebrow mb-3">States</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Default</Button>
              <Button className="bg-oriel-orange-deep">Hover</Button>
              <Button disabled>Disabled</Button>
            </div>
            <p className="mt-2 text-small text-oriel-slate">
              Tab to any control to see the 2px orange focus ring.
            </p>
          </div>
        </div>
      </Section>

      {/* FORMS */}
      <Section title="Form controls">
        <div className="grid max-w-2xl grid-cols-1 gap-5">
          <label className="block">
            <span className="mb-1.5 block text-small font-medium text-oriel-navy">Full name</span>
            <input
              type="text"
              placeholder="Jane Wanjiru"
              className="h-11 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate/60 focus-visible:border-oriel-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-1"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-small font-medium text-oriel-navy">
              M-Pesa phone number
            </span>
            <input
              type="tel"
              defaultValue="0722"
              aria-invalid="true"
              aria-describedby="phone-err"
              className="h-11 w-full rounded-input border border-oriel-orange bg-oriel-white px-3 text-body text-oriel-navy-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange"
            />
            <span id="phone-err" className="mt-1.5 flex items-center gap-1.5 text-small text-oriel-orange-deep">
              <AlertCircle size={15} strokeWidth={1.5} />
              Enter a valid Safaricom number, e.g. 0722 000 000.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-small font-medium text-oriel-navy">County</span>
            <select className="h-11 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-body text-oriel-navy-ink focus-visible:border-oriel-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange">
              <option>Nairobi</option>
              <option>Kiambu</option>
              <option>Machakos</option>
              <option>Nakuru</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-small font-medium text-oriel-navy">
              Delivery notes
            </span>
            <textarea
              rows={3}
              placeholder="Gate colour, landmark, best delivery time…"
              className="w-full rounded-input border border-oriel-line bg-oriel-white p-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate/60 focus-visible:border-oriel-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange"
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-oriel-line text-oriel-orange focus-visible:ring-2 focus-visible:ring-oriel-orange"
            />
            <span className="text-small text-oriel-navy-ink">
              Add professional installation to this order
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-small font-medium text-oriel-slate">
              Disabled field
            </span>
            <input
              disabled
              placeholder="Not editable"
              className="h-11 w-full rounded-input border border-oriel-line bg-oriel-mist px-3 text-body text-oriel-slate"
            />
          </label>
        </div>
      </Section>

      {/* PILLS & BADGES */}
      <Section title="Stock pills & badges">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-oriel-green/10 px-3 py-1 text-small font-medium text-oriel-green-deep">
            <Check size={14} strokeWidth={2} /> In stock
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-oriel-gold/20 px-3 py-1 text-small font-medium text-oriel-navy-ink">
            <AlertCircle size={14} strokeWidth={1.5} /> Low stock
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-oriel-mist px-3 py-1 text-small font-medium text-oriel-slate">
            On order
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-oriel-navy px-3 py-1 text-small font-medium text-oriel-white">
            Call for stock
          </span>
        </div>
      </Section>

      {/* ELEVATION & RADIUS */}
      <Section title="Elevation & radius">
        <div className="flex flex-wrap gap-6">
          <div className="w-48 rounded-card bg-oriel-white p-5 shadow-oriel-rest">
            <p className="font-display text-body font-semibold text-oriel-navy">Resting card</p>
            <p className="mt-1 font-mono text-[0.7rem] text-oriel-slate">shadow-oriel-rest · 12px</p>
          </div>
          <div className="w-48 rounded-card bg-oriel-white p-5 shadow-oriel-lift">
            <p className="font-display text-body font-semibold text-oriel-navy">Lifted / overlay</p>
            <p className="mt-1 font-mono text-[0.7rem] text-oriel-slate">shadow-oriel-lift · 12px</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-input bg-oriel-mist px-3 py-2 font-mono text-small text-oriel-slate">6px input</span>
            <span className="rounded-card bg-oriel-mist px-3 py-2 font-mono text-small text-oriel-slate">12px card</span>
            <span className="rounded-pill bg-oriel-mist px-3 py-2 font-mono text-small text-oriel-slate">999px pill</span>
          </div>
        </div>
      </Section>

      {/* SUN ARC */}
      <Section title="The sun arc — signature element">
        <p className="mb-4 max-w-2xl text-body text-oriel-slate">
          A gold-to-orange arc rising from a 2px green baseline — the one place all three
          brand colours meet. Used in exactly four places: the hero horizon, the checkout
          progress indicator, the M-Pesa waiting modal, and the footer flourish. Nowhere
          else.
        </p>
        <div className="overflow-hidden rounded-card bg-oriel-navy-deep p-8">
          <SunArc className="h-24" strokeWidth={4} id="guide-arc" />
        </div>
      </Section>
    </div>
  );
}
