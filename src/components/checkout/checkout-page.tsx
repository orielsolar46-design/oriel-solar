'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/cart/cart-provider';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { Button } from '@/components/ui/button';
import { formatKes } from '@/lib/shop';

/**
 * Checkout (MASTERPLAN 7.6): a single page with three panels and a compact
 * order summary. Prices shown are server-fetched; the order API recalculates
 * everything again at submission regardless.
 */
type PricedLine = { unitPrice: number | null; image: string | null };

export function CheckoutPage() {
  const { lines } = useCart();
  const [subtotal, setSubtotal] = React.useState<number | null>(null);
  const [unpriceable, setUnpriceable] = React.useState(false);
  const [byslug, setByslug] = React.useState<Record<string, PricedLine>>({});

  const slugsKey = lines.map((l) => l.slug).sort().join(',');
  React.useEffect(() => {
    if (!slugsKey) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cart/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: slugsKey.split(',') }),
        });
        const data = await res.json();
        if (cancelled || !data.ok) return;
        const map: Record<string, PricedLine> = {};
        for (const i of data.items as Array<
          { slug: string } & PricedLine
        >) {
          map[i.slug] = { unitPrice: i.unitPrice, image: i.image };
        }
        let sum = 0;
        let bad = false;
        for (const line of lines) {
          const unit = map[line.slug]?.unitPrice;
          if (unit == null) bad = true;
          else sum += unit * line.quantity;
        }
        setByslug(map);
        setSubtotal(sum);
        setUnpriceable(bad);
      } catch {
        // Totals stay pending; the server still guards order creation.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsKey]);

  if (lines.length === 0) {
    return (
      <div className="container-oriel py-16 text-center">
        <h1 className="t-h1">Checkout</h1>
        <p className="mt-4 text-body text-oriel-navy-ink">Your basket is empty.</p>
        <Button asChild className="mt-6">
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-oriel-mist">
      <div className="container-oriel grid gap-8 py-10 lg:grid-cols-[1fr_320px] lg:items-start">
        <div>
          <h1 className="sr-only">Checkout</h1>
          {unpriceable && (
            <p className="mb-4 rounded-card bg-oriel-gold-soft p-4 text-small text-oriel-navy-ink">
              An item in your basket has no confirmed price and will be rejected — go back to the
              basket and remove it first.
            </p>
          )}
          <CheckoutForm subtotal={subtotal ?? 0} />
        </div>

        <aside className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest lg:sticky lg:top-8">
          <h2 className="t-h3">Your order</h2>
          {/* Thumbnails here too: this is the last screen before money moves,
              and seeing the goods beats reading their names. */}
          <ul className="mt-3 space-y-3 border-b border-oriel-line pb-4">
            {lines.map((l) => {
              const image = byslug[l.slug]?.image ?? l.image;
              const unit = byslug[l.slug]?.unitPrice;
              return (
                <li key={l.slug} className="flex items-center gap-3">
                  {/* The badge sits outside the frame, so the frame owns the
                      overflow clipping and this wrapper does not. */}
                  <span className="relative h-14 w-14 shrink-0">
                    <span className="absolute inset-0 overflow-hidden rounded-input border border-oriel-line bg-oriel-white">
                      {image && (
                        <Image src={image} alt="" fill sizes="56px" className="object-contain p-1" />
                      )}
                    </span>
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-pill bg-oriel-navy px-1 font-mono text-[0.6875rem] font-medium text-oriel-white">
                      {l.quantity}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 text-caption leading-snug text-oriel-navy-ink">
                    {l.name}
                  </span>
                  {unit != null && (
                    <span className="shrink-0 font-mono text-caption text-oriel-navy-ink">
                      {formatKes(unit * l.quantity)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <dl className="mt-3 space-y-1.5 text-small">
            <div className="flex justify-between">
              <dt className="text-oriel-slate">Subtotal</dt>
              <dd className="font-mono font-medium text-oriel-navy-ink">
                {subtotal == null ? '…' : formatKes(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-oriel-line pt-2">
              <dt className="font-semibold text-oriel-navy">Total for goods</dt>
              <dd className="font-mono text-data font-medium text-oriel-navy-ink">
                {subtotal == null ? '…' : formatKes(subtotal)}
              </dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-micro text-oriel-slate">Incl. 16% VAT</p>
          <p className="mt-3 text-caption text-oriel-slate">
            Delivery paid on arrival.
          </p>
          <Link href="/cart" className="mt-3 block text-small text-oriel-slate underline underline-offset-2 hover:text-oriel-navy">
            Edit basket
          </Link>
        </aside>
      </div>
    </div>
  );
}
