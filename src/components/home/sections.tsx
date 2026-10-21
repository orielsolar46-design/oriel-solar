import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  Home as HomeIcon,
  Lamp,
  Leaf,
  Sun,
  Tractor,
  Zap,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/navigation';
import { getAllProducts, getCategoryShowcases } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { MpesaMark } from '@/components/ui/brand-icons';
import { ProductCard } from '@/components/shop/product-card';

/* ------------------------------------------------------------------ */
/* Block 2 — category grid: one card per stocked family, plus the      */
/* navy view-all tile                                                  */
/* ------------------------------------------------------------------ */

const NUMBER_WORDS: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six',
  7: 'Seven',
  8: 'Eight',
};

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
      <p className="t-eyebrow text-oriel-slate">The catalogue</p>
      <h2 id="cats-heading" className="t-h2 mt-2">
        {NUMBER_WORDS[stocked.length] ?? stocked.length} product families, one supplier
      </h2>
      {/* Each tile is a signpost, not a sales pitch: photograph, name, count.
          The descriptor line was dropped — a visitor scanning six tiles reads
          the pictures, and the detail belongs on the page they land on. */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
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
        <Link
          href="/shop"
          className="group flex flex-col justify-between rounded-card bg-oriel-navy p-4 transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-oriel-navy-deep hover:shadow-oriel-lift sm:p-6"
        >
          <h3 className="font-display text-[1.0625rem] font-semibold text-oriel-white sm:text-[1.25rem]">
            View all products
          </h3>
          <span className="mt-6 inline-flex items-center gap-2 font-sans text-small font-semibold text-oriel-gold">
            Browse everything
            <ArrowRight size={16} strokeWidth={1.5} className="transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
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
  // Two from each family so the row reads as portable power, solar and
  // accessories rather than six near-identical power stations.
  const pick = (category: string, n: number) =>
    ecoflow.filter((p) => p.category === category).slice(0, n);
  const products = [
    ...pick('battery-storage', 2),
    ...pick('solar-panels', 2),
    ...pick('balance-of-system', 2),
  ];
  if (products.length === 0) return null;
  return (
    <section aria-labelledby="ecoflow-heading" className="border-t border-oriel-line bg-oriel-white">
      <div className="container-oriel py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="t-eyebrow text-oriel-slate">EcoFlow</p>
            <h2 id="ecoflow-heading" className="t-h2 mt-2">
              Portable power, solar and accessories
            </h2>
          </div>
          <Link
            href="/shop?brand=EcoFlow"
            className="text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-4 hover:text-oriel-orange"
          >
            View all EcoFlow
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
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

export async function CategoryShowcase() {
  const showcases = await getCategoryShowcases(3);

  const nameOf = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
  const descriptorOf = (slug: string) =>
    CATEGORIES.find((c) => c.slug === slug)?.descriptor ?? '';

  // EcoFlow has its own section directly under the hero, so the generic shop
  // rows skip battery storage rather than showing the same products twice.
  const ordered = showcases
    .filter((row) => row.slug !== 'battery-storage')
    .sort((a, b) => {
      const ia = CATEGORIES.findIndex((c) => c.slug === a.slug);
      const ib = CATEGORIES.findIndex((c) => c.slug === b.slug);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  if (ordered.length === 0) return null;

  return (
    <section aria-labelledby="shop-heading" className="border-t border-oriel-line bg-oriel-white">
      <div className="container-oriel py-16">
        <p className="t-eyebrow text-oriel-slate">Shop</p>
        <h2 id="shop-heading" className="t-h2 mt-2">
          Buy it here, straight from this page
        </h2>
        <p className="mt-2 text-body text-oriel-navy-ink">
          Pay by M-Pesa, now or on delivery.
        </p>

        <div className="mt-10 space-y-12">
          {ordered.map((row) => (
            <div key={row.slug}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-oriel-line pb-3">
                <div>
                  <h3 className="font-display text-[1.25rem] font-semibold text-oriel-navy">
                    {nameOf(row.slug)}
                  </h3>
                  {descriptorOf(row.slug) && (
                    <p className="mt-0.5 text-small text-oriel-slate">{descriptorOf(row.slug)}</p>
                  )}
                </div>
                <Link
                  href={`/shop/${row.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-4 hover:text-oriel-orange"
                >
                  View all {row.total}
                  <ArrowRight size={15} strokeWidth={2} aria-hidden />
                </Link>
              </div>
              {/* A plain grid at every width. This used to swipe sideways
                  below sm, which hid the third product behind a gesture and
                  meant a shopper had to scroll across before they could scroll
                  down. Two cards across on a phone shows the whole row at
                  once. */}
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {row.products.map((product) => (
                  <li key={product.slug}>
                    <ProductCard product={product} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 3 — trust strip: the three brand pillars                     */
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
    <section aria-label="Why Oriel Power" className="border-t border-oriel-line bg-oriel-mist">
      <div className="container-oriel grid grid-cols-1 gap-8 py-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-oriel-line">
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
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 6 — solutions band                                           */
/* ------------------------------------------------------------------ */

export function SolutionsBand() {
  // Icon colours rotate through the brand set, as the reference does across
  // its solution tiles — green and gold carry as much of the set as navy.
  const solutions = [
    {
      icon: HomeIcon,
      title: 'Home backup',
      copy: 'Essentials on through every blackout.',
      href: '/solutions/home-backup',
      tone: 'text-oriel-green-deep',
      chip: 'bg-oriel-green-soft',
    },
    {
      icon: Sun,
      title: 'Full solar home',
      copy: 'Generate most of what you use.',
      href: '/solutions/full-solar-home',
      tone: 'text-oriel-gold',
      chip: 'bg-oriel-gold-soft',
    },
    {
      icon: Building2,
      title: 'Business & commercial',
      copy: 'Cut costs, keep trading.',
      href: '/solutions/business-commercial',
      tone: 'text-oriel-navy',
      chip: 'bg-oriel-mist',
    },
    {
      icon: Tractor,
      title: 'Farm & irrigation',
      copy: 'Pump water on sunshine.',
      href: '/solutions/farm-irrigation',
      tone: 'text-oriel-green-deep',
      chip: 'bg-oriel-green-soft',
    },
    {
      icon: Lamp,
      title: 'Estate & street lighting',
      copy: 'Dusk to dawn, no trenching.',
      href: '/solutions/estate-street-lighting',
      tone: 'text-oriel-gold',
      chip: 'bg-oriel-gold-soft',
    },
  ];
  return (
    <section aria-labelledby="solutions-heading" className="border-t border-oriel-line bg-oriel-mist">
      <div className="container-oriel py-16">
        <p className="t-eyebrow text-oriel-slate">Solutions</p>
        <h2 id="solutions-heading" className="t-h2 mt-2">
          Built for how you&apos;ll use it
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {solutions.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
              >
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-pill ${s.chip}`}
                >
                  <Icon size={22} strokeWidth={1.5} className={s.tone} aria-hidden />
                </span>
                <h3 className="mt-3 font-display text-[1rem] font-semibold leading-snug text-oriel-navy">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-small text-oriel-slate">{s.copy}</p>
                {/* Navy text with an orange arrow: orange at this size on
                    white measures 3.06:1 and fails AA, which is exactly what
                    the brief's own contrast rule warns about. */}
                <span className="mt-4 inline-flex items-center gap-1 text-small font-semibold text-oriel-navy">
                  Explore
                  <ArrowRight
                    size={15}
                    strokeWidth={1.5}
                    className="text-oriel-orange transition-transform group-hover:translate-x-1"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 7 — THE GREEN BAND: savings and sustainability               */
/* ------------------------------------------------------------------ */

export function GreenBand() {
  return (
    <section aria-labelledby="green-heading" className="bg-oriel-green-deep">
      <div className="container-oriel py-16 lg:py-20">
        {/* Gold on deep green measures 3.2:1 — fine for the large display
            figures the brief reserves gold for, but not for 12px eyebrow
            text. Gold-soft carries the warmth and passes AA. */}
        <p className="t-eyebrow text-oriel-gold-soft">Why people switch</p>
        <h2 id="green-heading" className="t-h2 mt-2 max-w-3xl text-oriel-white">
          Every unit you generate is one you don&apos;t buy.
        </h2>

        {/* The four statistics render here once the client confirms
            {{SAVINGS_BAND_STATISTICS}} — figures are never invented. */}

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Cut your KPLC bill',
              copy: 'Covers the daytime load first.',
            },
            {
              icon: Tractor,
              title: 'Stop buying diesel',
              copy: 'Retire the generator and its fuel runs.',
            },
            {
              icon: HomeIcon,
              title: 'Add value to your property',
              copy: 'A warranted installation sells with the building.',
            },
          ].map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.title}>
                <Icon size={22} strokeWidth={1.5} className="text-oriel-white" aria-hidden />
                <h3 className="mt-3 font-display text-[1.0625rem] font-semibold text-oriel-white">
                  {col.title}
                </h3>
                <p className="mt-1.5 text-small text-oriel-white">{col.copy}</p>
              </div>
            );
          })}
        </div>

        {/* Explicit white text: the Slot merge left the anchor inheriting the
            body's navy-ink, which measured 3.44:1 against the green. */}
        <Button asChild variant="outline-light" size="lg" className="mt-10 !text-oriel-white">
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
      <p className="mt-8 flex items-start gap-3 rounded-card bg-oriel-green-soft p-4 text-small text-oriel-navy-ink">
        <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-oriel-green-deep" aria-hidden />
        Pay on delivery on every order. Approve at handover — no cash.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Block 9 — brands we supply                                         */
/* ------------------------------------------------------------------ */

export function BrandsRow() {
  const brands = ['Jinko Solar', 'Livoltek', 'Solis', 'Growatt', 'Deye', 'Victron', 'Lorentz', 'Hanti'];
  return (
    <section aria-label="Brands we supply" className="border-y border-oriel-line bg-oriel-mist">
      <div className="container-oriel py-10">
        <p className="t-eyebrow text-center text-oriel-slate">Brands we supply</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {brands.map((brand) => (
            <li
              key={brand}
              className="font-display text-[1.125rem] font-semibold text-oriel-slate transition-colors duration-200 hover:text-oriel-navy"
            >
              {brand}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

