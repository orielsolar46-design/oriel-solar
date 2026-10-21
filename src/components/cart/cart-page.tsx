'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageOff, Minus, Plus, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { COUNTIES } from '@/lib/counties';
import { formatKes } from '@/lib/shop';

type PricedItem = {
  slug: string;
  name: string;
  modelCode: string | null;
  category: string;
  image: string | null;
  unitPrice: number | null;
  quoteOnly: boolean;
  requiresInstallation: boolean;
};

/**
 * The basket (MASTERPLAN 7.5). Lines live in localStorage; every price on
 * this page is fetched fresh from the server.
 *
 * Where the order is going is asked here, once: a county and the place in the
 * buyer's own words. Checkout reads it back rather than asking again. The
 * delivery charge is not quoted at any point — it is worked out on delivery,
 * so the total on this page is the goods and nothing else.
 */
export function CartPage() {
  const { lines, setQuantity, remove, destination, setDestination } = useCart();
  const [priced, setPriced] = React.useState<Record<string, PricedItem> | null>(null);

  const slugsKey = lines.map((l) => l.slug).sort().join(',');
  React.useEffect(() => {
    if (!slugsKey) {
      setPriced({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cart/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: slugsKey.split(',') }),
        });
        const data = await res.json();
        if (!cancelled && data.ok) {
          const map: Record<string, PricedItem> = {};
          for (const item of data.items) map[item.slug] = item;
          setPriced(map);
        }
      } catch {
        if (!cancelled) setPriced({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slugsKey]);

  if (lines.length === 0) {
    return (
      <div className="container-oriel py-16">
        <h1 className="t-h1">Your basket</h1>
        <div className="mt-8 max-w-xl rounded-card border border-oriel-line bg-oriel-mist p-8">
          <p className="text-body text-oriel-navy-ink">Nothing in your basket yet.</p>
          <p className="mt-1 text-small text-oriel-slate">
            Browse products, or ask us to quote a whole system.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/request-a-quote">Request a quote</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shop">Browse products</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = lines.reduce((sum, l) => {
    const unit = priced?.[l.slug]?.unitPrice;
    return sum + (unit != null ? unit * l.quantity : 0);
  }, 0);
  const allPriced =
    priced != null && lines.every((l) => priced[l.slug] && priced[l.slug].unitPrice != null);
  const anyInstallation = lines.some((l) => l.withInstallation);

  return (
    <div className="container-oriel py-10">
      <h1 className="t-h1">Your basket</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Lines */}
        <ul className="space-y-3">
          {lines.map((line) => {
            const item = priced?.[line.slug];
            // The server's image wins over the one stored in the basket: a
            // basket can sit in localStorage for weeks, and the catalogue may
            // have gained real photography since the item was added.
            const image = item?.image ?? line.image;
            const href = item ? `/shop/${item.category}/${line.slug}` : '/shop';
            return (
              <li
                key={line.slug}
                className="flex gap-4 rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest sm:gap-5"
              >
                <Link
                  href={href}
                  aria-hidden
                  tabIndex={-1}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-input border border-oriel-line bg-oriel-white sm:h-28 sm:w-28"
                >
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-oriel-mist text-oriel-slate">
                      <ImageOff size={20} strokeWidth={1.5} aria-hidden />
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={href}
                      className="block font-display text-[0.9375rem] font-semibold leading-snug text-oriel-navy hover:text-oriel-orange"
                    >
                      {line.name}
                    </Link>
                    {line.modelCode && (
                      <span className="mt-0.5 block font-mono text-micro text-oriel-slate">
                        {line.modelCode}
                      </span>
                    )}
                    {line.withInstallation && (
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-pill bg-oriel-green-soft px-2.5 py-1 text-micro font-medium text-oriel-green-deep">
                        <Wrench size={12} strokeWidth={1.75} aria-hidden />
                        With professional installation
                      </span>
                    )}

                    {/* 44px controls: this is a phone-first market and the
                        stepper is the most-tapped thing on the page. */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex items-center rounded-input border border-oriel-line">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${line.name}`}
                          onClick={() => setQuantity(line.slug, line.quantity - 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-l-input text-oriel-navy hover:bg-oriel-mist"
                        >
                          <Minus size={16} strokeWidth={1.5} />
                        </button>
                        <span className="w-8 text-center font-mono text-[0.875rem]">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${line.name}`}
                          onClick={() => setQuantity(line.slug, line.quantity + 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-r-input text-oriel-navy hover:bg-oriel-mist"
                        >
                          <Plus size={16} strokeWidth={1.5} />
                        </button>
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(line.slug)}
                        aria-label={`Remove ${line.name} from your basket`}
                        className="inline-flex min-h-[44px] items-center px-2 text-caption text-oriel-slate underline underline-offset-2 hover:text-oriel-navy"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:w-36 sm:text-right">
                    {item == null ? (
                      <span className="text-caption text-oriel-slate">…</span>
                    ) : item.unitPrice != null ? (
                      <>
                        <span className="block font-mono text-data font-medium text-oriel-navy-ink">
                          {formatKes(item.unitPrice * line.quantity)}
                        </span>
                        {line.quantity > 1 && (
                          <span className="block font-mono text-micro text-oriel-slate">
                            {formatKes(item.unitPrice)} each
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-caption text-oriel-slate">Price pending</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Sticky summary */}
        <aside className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest lg:sticky lg:top-24">
          <h2 className="t-h3">Summary</h2>

          <fieldset className="mt-4 space-y-3">
            <legend className="text-small font-medium text-oriel-navy-ink">
              Where are we delivering?
            </legend>
            <div>
              <label htmlFor="cart-county" className="sr-only">
                County
              </label>
              <select
                id="cart-county"
                value={destination.county}
                onChange={(e) => setDestination({ county: e.target.value })}
                className="h-11 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-small text-oriel-navy-ink focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
              >
                <option value="">Choose your county…</option>
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cart-place" className="sr-only">
                Town, estate or landmark
              </label>
              <input
                id="cart-place"
                value={destination.place}
                onChange={(e) => setDestination({ place: e.target.value })}
                placeholder="Town, estate or landmark"
                className="h-11 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-small text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
              />
            </div>
          </fieldset>

          <dl className="mt-4 space-y-2 border-t border-oriel-line pt-4 text-small">
            <div className="flex justify-between">
              <dt className="text-oriel-slate">Subtotal</dt>
              <dd className="font-mono font-medium text-oriel-navy-ink">
                {priced == null ? '…' : formatKes(subtotal)}
              </dd>
            </div>
            {anyInstallation && (
              <div className="flex justify-between">
                <dt className="text-oriel-slate">Installation</dt>
                <dd className="text-oriel-green-deep">Quoted with your order</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-oriel-line pt-2">
              <dt className="font-semibold text-oriel-navy">Total for goods</dt>
              <dd className="font-mono text-data font-medium text-oriel-navy-ink">
                {priced == null ? '…' : formatKes(subtotal)}
              </dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-micro text-oriel-slate">Incl. 16% VAT</p>
          <p className="mt-3 rounded-input bg-oriel-green-soft px-3 py-2 text-caption text-oriel-navy-ink">
            Delivery is paid on arrival. Collection is free.
          </p>

          {!allPriced && priced != null && (
            <p className="mt-3 rounded-input bg-oriel-gold-soft p-3 text-caption text-oriel-navy-ink">
              Some items are awaiting confirmed pricing and can&apos;t be checked out yet — remove
              them, or request a quote and we&apos;ll price the whole basket together.
            </p>
          )}

          <Button asChild size="lg" className="mt-4 w-full" disabled={!allPriced}>
            <Link
              href={allPriced ? '/checkout' : '#'}
              aria-disabled={!allPriced}
              tabIndex={allPriced ? undefined : -1}
              onClick={(e) => {
                if (!allPriced) e.preventDefault();
              }}
            >
              Proceed to checkout
            </Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
