import Image from 'next/image';
import Link from 'next/link';
import { BatteryCharging, Building2, Sun, Tractor, Wrench } from 'lucide-react';
import { DeliveryIcon, LocationIcon, MpesaMark } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';

const NEEDS = [
  {
    label: 'Home backup',
    copy: 'Keep the lights on',
    href: '/solutions/home-backup',
    icon: BatteryCharging,
    chip: 'bg-oriel-green-soft',
    tone: 'text-oriel-green-deep',
  },
  {
    label: 'Full solar',
    copy: 'Generate your own',
    href: '/solutions/full-solar-home',
    icon: Sun,
    chip: 'bg-oriel-gold-soft',
    tone: 'text-oriel-orange-deep',
  },
  {
    label: 'Business',
    copy: 'Cut operating costs',
    href: '/solutions/business-commercial',
    icon: Building2,
    chip: 'bg-oriel-mist',
    tone: 'text-oriel-navy',
  },
  {
    label: 'Farm & water',
    copy: 'Pump on sunshine',
    href: '/solutions/farm-irrigation',
    icon: Tractor,
    chip: 'bg-oriel-green-soft',
    tone: 'text-oriel-green-deep',
  },
] as const;

/**
 * Home hero. A dusk photograph of a modern home with rooftop solar carries the
 * promise, the headline sits over a deep-navy scrim, and the short needs bar
 * overlaps the image edge so the next step is visible before the fold.
 */
export function Hero() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-oriel-navy-deep">
        <Image
          src="/brand/home-hero.webp"
          alt="A modern home at dusk with rooftop solar and a home battery"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-oriel-navy-deep/20" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-r from-oriel-navy-deep via-oriel-navy-deep/75 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-oriel-navy-deep/70 via-transparent to-oriel-navy-deep/15"
          aria-hidden
        />

        <div className="container-oriel relative flex min-h-[36rem] flex-col justify-center py-20 md:min-h-[42rem] md:py-28 lg:py-32">
          <p className="hero-line t-eyebrow text-oriel-gold" style={{ animationDelay: '100ms' }}>
            Solar supply · Sizing · Installation — Nairobi, Kenya
          </p>
          <h1
            className="hero-line t-display mt-4 max-w-4xl text-oriel-white"
            style={{ animationDelay: '180ms' }}
          >
            Power that doesn&apos;t
            <br />
            <span className="text-oriel-green">ask permission.</span>
          </h1>
          <p
            className="hero-line mt-5 max-w-xl text-body-lg text-oriel-white/90"
            style={{ animationDelay: '260ms' }}
          >
            Tier 1 panels, storage and inverters — sized, supplied, installed.
          </p>
          <div className="hero-fade mt-8 flex flex-wrap gap-3" style={{ animationDelay: '340ms' }}>
            <Button asChild size="lg">
              <Link href="/shop">Shop products</Link>
            </Button>
            <Button asChild variant="outline-light" size="lg" className="!text-oriel-white">
              <Link href="/request-a-quote">Request a quote</Link>
            </Button>
          </div>

          <ul
            className="hero-fade mt-10 grid max-w-2xl grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6"
            style={{ animationDelay: '420ms' }}
          >
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
            <li className="flex items-center gap-1.5 text-small text-oriel-white">
              <MpesaMark height={16} tone="dark" />
              accepted
            </li>
          </ul>
        </div>
      </section>

      <div className="relative z-20 -mt-8">
        <div className="container-oriel">
          <nav
            aria-label="Shop by need"
            className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-oriel-line bg-oriel-line shadow-oriel-lift md:grid-cols-4"
          >
            {NEEDS.map((need) => {
              const Icon = need.icon;
              return (
                <Link
                  key={need.href}
                  href={need.href}
                  className="group flex items-center gap-3 bg-oriel-white p-4 transition-colors hover:bg-oriel-mist sm:p-5"
                >
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill ${need.chip}`}
                  >
                    <Icon size={19} strokeWidth={1.75} className={need.tone} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[0.9375rem] font-semibold leading-tight text-oriel-navy transition-colors group-hover:text-oriel-orange sm:text-[1rem]">
                      {need.label}
                    </span>
                    <span className="mt-0.5 block text-micro leading-tight text-oriel-slate">
                      {need.copy}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
