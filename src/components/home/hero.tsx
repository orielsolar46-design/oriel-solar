'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { DeliveryIcon, LocationIcon, MpesaMark } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';

/**
 * Home hero (MASTERPLAN 7.1 block 1). Full-bleed deep navy; the sun arc draws
 * low across the frame from its green baseline with the headline breaking its
 * plane. The site's ONE orchestrated load sequence: arc draws (600ms), the
 * headline rises with a line stagger, CTAs fade in. Runs once — CSS
 * animations replay only on full page load, never on route transitions back,
 * and prefers-reduced-motion renders final states immediately (globals.css).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-oriel-navy-deep">
      {/* The arc, sitting low so the headline breaks its plane */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[-8%] h-[70%]" aria-hidden>
        <svg
          className="block h-full w-full"
          viewBox="0 0 1200 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="hero-arc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#F26A21" />
            </linearGradient>
          </defs>
          <line
            x1="0"
            y1="190"
            x2="1200"
            y2="190"
            stroke="#3FA535"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="hero-baseline"
          />
          <path
            d="M 0 190 Q 600 -60 1200 190"
            stroke="url(#hero-arc)"
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            className="hero-arc-path"
          />
        </svg>
      </div>

      <div className="container-oriel relative py-20 md:py-28 lg:py-32">
        <p className="hero-line t-eyebrow text-oriel-gold" style={{ animationDelay: '600ms' }}>
          Solar supply · Sizing · Installation — Nairobi, Kenya
        </p>
        {/* Two-colour headline, following the client's reference where the
            headline itself carries green. Split at the clause boundary so it
            still reads as one sentence. */}
        <h1
          className="hero-line t-display mt-4 max-w-4xl text-oriel-white"
          style={{ animationDelay: '700ms' }}
        >
          Power that doesn&apos;t
          <br />
          <span className="text-oriel-green">ask permission.</span>
        </h1>
        <p
          className="hero-line mt-5 max-w-xl text-body-lg text-oriel-white/85"
          style={{ animationDelay: '800ms' }}
        >
          Tier 1 panels, storage and inverters — sized, supplied, installed.
        </p>
        <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: '1000ms' }}>
          <Button asChild size="lg">
            <Link href="/shop">Shop products</Link>
          </Button>
          <Button asChild variant="outline-light" size="lg" className="!text-oriel-white">
            <Link href="/request-a-quote">Request a quote</Link>
          </Button>
        </div>
        {/* Reassurance strip — the four objections a Kenyan buyer raises
            before they will consider the price. Icons rather than dots, so
            each one reads at a glance on a phone; the brand colours stay in
            rotation as the reference distributes them. */}
        <ul
          className="hero-fade mt-10 grid max-w-2xl grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6"
          style={{ animationDelay: '1100ms' }}
        >
          {/* Location and delivery carry their own brand marks, so they are
              listed out rather than driven from one icon array — they take a
              `tone` for the navy instead of lucide's size/strokeWidth pair. */}
          <li className="flex items-center gap-2 text-small text-oriel-white">
            <LocationIcon size={18} tone="dark" />
            Nairobi based
          </li>
          <li className="flex items-center gap-2 text-small text-oriel-white">
            <DeliveryIcon size={16} tone="dark" />
            Nationwide delivery
          </li>
          <li className="flex items-center gap-2 text-small text-oriel-white">
            <Wrench size={17} strokeWidth={1.75} className="text-oriel-green" aria-hidden />
            We install
          </li>
          {/* M-Pesa is a brand, not a concept, so it gets its own mark rather
              than a generic handset outline like the three above. */}
          <li className="flex items-center gap-1.5 text-small text-oriel-white">
            <MpesaMark height={16} tone="dark" />
            accepted
          </li>
        </ul>
      </div>
    </section>
  );
}
