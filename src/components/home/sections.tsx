import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, Leaf, Sun } from 'lucide-react';
import { CATEGORIES } from '@/lib/navigation';
import { BLUETTI_FLAGSHIP_SLUGS, getAllProducts } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { ArrowPill } from '@/components/ui/arrow-pill';
import { VerifiedBadge } from '@/components/brand/verified-badge';
import { BRAND_PAGES } from '@/lib/brands';
import { MpesaMark } from '@/components/ui/brand-icons';
import { ProductCard } from '@/components/shop/product-card';

/* ------------------------------------------------------------------ */
/* Category grid: one card per stocked family                          */
/* ------------------------------------------------------------------ */

export async function CategoryGrid() {
  // One catalogue read (cached per request) serves both the counts and the
  // representative image for every category.
  const catalogue = await getAllProducts();
  // A category with nothing to sell yet is left off the grid entirely rather
  // than shown as an empty card: the tile would carry a placeholder image and
  // a "0 products" line, and it links to a page with nothing on it.
  const summary = new Map<string, { count: number; image: string }>();
  for (const cat of CATEGORIES) {
    const items = catalogue.filter((p) => p.category === cat.slug);
    const image = items.find((p) => p.images.length > 0)?.images[0]?.url;
    if (items.length > 0 && image) summary.set(cat.slug, { count: items.length, image });
  }
  const stocked = CATEGORIES.filter((cat) => summary.has(cat.slug));

  return (
    <section aria-labelledby="cats-heading" className="container-oriel py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="t-eyebrow text-oriel-slate">The catalogue</p>
          <h2 id="cats-heading" className="t-h2 mt-2">
            Shop by category
          </h2>
        </div>
        <ArrowPill href="/shop" className="ml-auto">
          All products
        </ArrowPill>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {stocked.map((cat) => {
          const { count, image } = summary.get(cat.slug)!;
          return (
            <Link
              key={cat.slug}
              href={`/shop/${cat.slug}`}
              className="group flex flex-col rounded-card border border-oriel-line bg-oriel-white p-3 shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift sm:p-4"
            >
              <div className="relative aspect-square overflow-hidden rounded-input bg-oriel-mist">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 45vw, 25vw, 280px"
                  className="object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 font-display text-[0.9375rem] font-semibold leading-snug text-oriel-navy transition-colors group-hover:text-oriel-orange sm:text-[1.0625rem]">
                {cat.name}
              </h3>
              <p className="mt-auto pt-2 font-mono text-micro text-oriel-slate">
                {count} {count === 1 ? 'product' : 'products'}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 4 — per-family product rows: three products you can buy from  */
/* the home page, plus a way into the rest of the family               */
/* ------------------------------------------------------------------ */

export async function EcoFlowShowcase() {
  const catalogue = await getAllProducts();
  const ecoflow = catalogue.filter((p) => p.brand === 'EcoFlow');
  // The four newest batteries, in descending order of capability. Keeping a
  // fixed list means the row always reads as a ladder (Pro 3 → Ultra → Max →
  // Plus) instead of changing with catalogue sort order.
  const latest = [
    'ecoflow-delta-pro-3-portable-power-station',
    'ecoflow-delta-3-ultra-portable-power-station',
    'ecoflow-delta-3-max-portable-power-station',
    'ecoflow-delta-3-plus-portable-power-station',
  ];
  const products = latest
    .map((slug) => ecoflow.find((p) => p.slug === slug))
    .filter((p): p is (typeof ecoflow)[number] => Boolean(p));
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="ecoflow-heading" className="border-t border-oriel-line bg-oriel-white">
      <div className="container-oriel py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="t-eyebrow text-oriel-slate">EcoFlow</p>
            <h2 id="ecoflow-heading" className="t-h2 mt-2">
              The latest EcoFlow batteries
            </h2>
            <VerifiedBadge label={BRAND_PAGES.ecoflow.badge} href="/ecoflow" className="mt-3" />
          </div>
          <ArrowPill href="/ecoflow" className="ml-auto">
            View all EcoFlow
          </ArrowPill>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function VestwoodsShowcase() {
  const catalogue = await getAllProducts();
  // Fixed order so the row reads as a range: portable stations first, then
  // home batteries by capacity, then the inverter that ties them together.
  const showcase = [
    'vestwoods-rescube-500w',
    'vestwoods-rescube-1000w',
    'vestwoods-ve51100l-5-12kwh',
    'vestwoods-ve51200l-10-24kwh',
    'vestwoods-ve51314l-16-07kwh',
    'vestwoods-se6khb-6kw',
  ];
  const products = showcase
    .map((slug) => catalogue.find((p) => p.slug === slug))
    .filter((p): p is (typeof catalogue)[number] => Boolean(p));
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="vestwoods-heading"
      className="border-t border-oriel-line bg-oriel-mist"
    >
      <div className="container-oriel py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-oriel-slate">Vestwoods</p>
            <h2 id="vestwoods-heading" className="t-h2 mt-2">
              Portable power to whole-home storage
            </h2>
          </div>
          <ArrowPill href="/shop?brand=Vestwoods" className="ml-auto">
            View all Vestwoods
          </ArrowPill>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function MarstekShowcase() {
  const catalogue = await getAllProducts();
  const showcase = ['marstek-s500s', 'marstek-s1000p-s', 'marstek-s2000f'];
  const products = showcase
    .map((slug) => catalogue.find((p) => p.slug === slug))
    .filter((p): p is (typeof catalogue)[number] => Boolean(p));
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="marstek-heading"
      className="border-t border-oriel-line bg-oriel-white"
    >
      <div className="container-oriel py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-oriel-slate">Marstek</p>
            <h2 id="marstek-heading" className="t-h2 mt-2">
              Portable power stations
            </h2>
            <p className="mt-3 max-w-xl text-small text-oriel-slate">
              500W, 1,000W and 2,000W units for outages, travel and site work, priced and ready to
              deliver.
            </p>
          </div>
          <ArrowPill href="/shop?brand=Marstek" className="ml-auto">
            View all Marstek
          </ArrowPill>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {products.map((product, index) => (
            <li
              key={product.slug}
              className={
                index === products.length - 1 && products.length % 2 === 1
                  ? 'col-span-2 sm:col-span-1'
                  : undefined
              }
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export async function BluettiShowcase() {
  const catalogue = await getAllProducts();
  const bluetti = catalogue.filter((p) => p.brand === 'Bluetti');
  // The flagships: fixed home storage at both ends of the range, plus the
  // modular stations that scale with the load. Same fixed-list approach as
  // EcoFlow so the row reads as a ladder rather than changing with sort order.
  const products = BLUETTI_FLAGSHIP_SLUGS
    .map((slug) => bluetti.find((p) => p.slug === slug))
    .filter((p): p is (typeof bluetti)[number] => Boolean(p));
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="bluetti-heading"
      className="border-t border-white/10 bg-oriel-navy"
    >
      <div className="container-oriel py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="t-eyebrow text-oriel-gold">Bluetti</p>
            <h2 id="bluetti-heading" className="t-h2 mt-2 text-oriel-white">
              Whole-home backup, engineered
            </h2>
            <VerifiedBadge
              label={BRAND_PAGES.bluetti.badge}
              href="/bluetti"
              tone="dark"
              className="mt-3"
            />
          </div>
          <ArrowPill href="/bluetti" className="ml-auto">
            View all Bluetti
          </ArrowPill>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.slug}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip: the three brand pillars                               */
/* ------------------------------------------------------------------ */

export function TrustStrip() {
  // Each pillar takes a different brand colour, as the reference does with its
  // value icons — gold, green, navy rather than one colour repeated.
  const pillars = [
    {
      icon: Award,
      title: 'Premium Quality',
      copy: 'Tier 1 manufacturers, genuine stock.',
      tone: 'text-oriel-gold',
      chip: 'bg-oriel-gold-soft',
    },
    {
      icon: Leaf,
      title: 'Sustainable Solutions',
      copy: 'Displaces diesel and grid carbon.',
      tone: 'text-oriel-green-deep',
      chip: 'bg-oriel-green-soft',
    },
    {
      icon: Sun,
      title: 'Powering a Cleaner Future',
      copy: 'Homes, farms and businesses across Kenya.',
      tone: 'text-oriel-navy',
      chip: 'bg-oriel-mist',
    },
  ];
  return (
    <section aria-labelledby="trust-heading" className="border-t border-oriel-line bg-oriel-mist">
      <div className="container-oriel py-14">
        <div className="max-w-2xl">
          <p className="t-eyebrow text-oriel-slate">Why Oriel</p>
          <h2 id="trust-heading" className="t-h2 mt-2">
            Power you can trust
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-oriel-line">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-pill ${pillar.chip}`}
                >
                  <Icon size={24} strokeWidth={1.5} className={pillar.tone} aria-hidden />
                </span>
                <h3 className="t-h3 mt-3">{pillar.title}</h3>
                <p className="mt-1.5 text-small text-oriel-navy-ink">{pillar.copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Savings call to action                                             */
/* ------------------------------------------------------------------ */

export function GreenBand() {
  return (
    <section aria-labelledby="green-heading" className="bg-oriel-green-deep">
      <div className="container-oriel flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-14">
        <div>
          <p className="t-eyebrow text-oriel-gold-soft">Why people switch</p>
          <h2 id="green-heading" className="t-h2 mt-2 max-w-2xl text-oriel-white">
            Every unit you generate is one you don&apos;t buy.
          </h2>
        </div>
        <Button asChild variant="outline-light" size="lg" className="!text-oriel-white">
          <Link href="/request-a-quote">See what you&apos;d save</Link>
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 8 — how buying works                                         */
/* ------------------------------------------------------------------ */

export function HowBuyingWorks() {
  // The step chips alternate navy and green, so the sequence carries the
  // secondary brand colour rather than reading as four identical navy blocks.
  // Step 03 names a brand rather than an action, so titles are nodes and that
  // one carries the M-Pesa mark instead of setting the name as words.
  const steps: { n: string; title: ReactNode; copy: string; chip: string }[] = [
    {
      n: '01',
      title: 'Choose or get sized',
      copy: 'Browse, or ask an engineer to size it.',
      chip: 'bg-oriel-navy text-oriel-gold',
    },
    {
      n: '02',
      title: 'Order online',
      copy: 'Guest checkout, no account.',
      chip: 'bg-oriel-green-deep text-oriel-gold-soft',
    },
    {
      n: '03',
      title: (
        <span className="inline-flex items-center gap-1.5">
          Pay by <MpesaMark height={15} />
        </span>
      ),
      copy: 'Approve on your phone. Now, or on delivery.',
      chip: 'bg-oriel-navy text-oriel-gold',
    },
    {
      n: '04',
      title: 'Delivered and installed',
      copy: 'Nationwide delivery and installation.',
      chip: 'bg-oriel-green-deep text-oriel-gold-soft',
    },
  ];
  return (
    <section aria-labelledby="how-heading" className="container-oriel border-t border-oriel-line py-16">
      <p className="t-eyebrow text-oriel-slate">How buying works</p>
      <h2 id="how-heading" className="t-h2 mt-2">
        Four steps, no surprises
      </h2>
      <ol className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 border-t border-oriel-line pt-8 lg:grid-cols-4">
        {steps.map((step) => (
          <li key={step.n}>
            {/* Numerals never sit on white — gold on white is 1.73:1. On navy,
                gold reads at 7.78:1; on deep green, gold drops to 2.97:1 and
                fails, so the green chips use gold-soft at 4.78:1 instead. */}
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-input font-mono text-[1.0625rem] font-medium ${step.chip}`}
            >
              {step.n}
            </span>
            <h3 className="mt-2 font-display text-[1rem] font-semibold uppercase tracking-wide text-oriel-navy">
              {step.title}
            </h3>
            <p className="mt-1.5 text-small text-oriel-navy-ink">{step.copy}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 9 — brands we supply                                         */
/* ------------------------------------------------------------------ */

export function BrandsRow() {
  const brands = [
    'EcoFlow',
    'Bluetti',
    'Vestwoods',
    'Jinko Solar',
    'Livoltek',
    'Solis',
    'Growatt',
    'Deye',
    'Victron',
    'Lorentz',
    'Hanti',
  ];
  return (
    <section aria-label="Brands we supply" className="border-y border-oriel-line bg-oriel-mist">
      <div className="container-oriel py-10">
        <p className="t-eyebrow text-center text-oriel-slate">Brands we supply</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => {
            const page = Object.values(BRAND_PAGES).find((b) => b.brand === brand);
            return (
              <li
                key={brand}
                className="font-display text-[1.125rem] font-semibold text-oriel-slate transition-colors duration-200 hover:text-oriel-navy"
              >
                {/* The brands with a landing page link to it: that is the page
                    a person lands on when they search the brand name. */}
                {page ? (
                  <Link href={`/${page.slug}`} className="hover:text-oriel-navy">
                    {brand}
                  </Link>
                ) : (
                  brand
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

