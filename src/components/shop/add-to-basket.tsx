'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/utils';

type ProductForBasket = {
  slug: string;
  name: string;
  modelCode: string | null;
  image: string | null;
  priced: boolean;
  quoteOnly: boolean;
  outOfStock?: boolean;
};

/**
 * Card action sizing. Two things are going on:
 *
 * 44px minimum height on a phone — this is the conversion button and it now
 * sits on the home page too, where most of the traffic is a thumb.
 *
 * And the label wraps rather than staying on one line: the base button is
 * `whitespace-nowrap`, which at two cards across a phone pushed "Request a
 * quote" straight past the edge of the card. From `sm` up there is room, so it
 * reverts to the normal fixed-height, single-line button.
 */
const CARD_BUTTON =
  'h-auto min-h-[2.75rem] w-full whitespace-normal px-2 py-1.5 text-caption leading-tight sm:h-9 sm:min-h-0 sm:whitespace-nowrap sm:px-3 sm:text-small';

/** Compact card action: orange Add to basket, or a quote link when unpriced. */
export function AddToBasketButton({ product }: { product: ProductForBasket }) {
  const { add } = useCart();
  const [added, setAdded] = React.useState(false);

  // Out of stock beats every other state: there is nothing to put in a basket,
  // so the action becomes a way to reach a person rather than a dead button.
  if (product.outOfStock) {
    return (
      <Button asChild variant="outline" size="sm" className={CARD_BUTTON}>
        <Link href={`/request-a-quote?product=${product.slug}`}>Ask when it&apos;s back</Link>
      </Button>
    );
  }

  if (product.quoteOnly || !product.priced) {
    return (
      <Button asChild variant="outline" size="sm" className={CARD_BUTTON}>
        <Link href={`/request-a-quote?product=${product.slug}`}>Request a quote</Link>
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={CARD_BUTTON}
      onClick={() => {
        add({
          slug: product.slug,
          name: product.name,
          modelCode: product.modelCode,
          image: product.image,
          withInstallation: false,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? (
        <>
          <Check size={16} strokeWidth={2} /> Added to basket
        </>
      ) : (
        <>
          <ShoppingCart size={16} strokeWidth={1.5} /> Add to basket
        </>
      )}
    </Button>
  );
}

/** PDP buy box: quantity stepper + full-width Add to basket + Buy now. */
export function BuyBox({
  product,
  installation,
}: {
  product: ProductForBasket;
  installation: boolean;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [withInstallation, setWithInstallation] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  if (product.outOfStock) {
    return (
      <div className="space-y-3">
        <p className="rounded-card border border-oriel-line bg-oriel-mist p-4 text-small text-oriel-navy-ink">
          <span className="block font-display text-[1rem] font-semibold text-oriel-navy">
            Out of stock
          </span>
          We will tell you the moment it is back, and can suggest an equivalent in the meantime.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href={`/request-a-quote?product=${product.slug}`}>Ask when it&apos;s back</Link>
        </Button>
      </div>
    );
  }

  if (product.quoteOnly || !product.priced) {
    return (
      <div className="space-y-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/request-a-quote?product=${product.slug}`}>Request a quote</Link>
        </Button>
        <p className="text-small text-oriel-slate">
          {product.quoteOnly
            ? 'This system is priced per project. Tell us about your site and a quotation follows within one working day.'
            : 'Retail pricing for this item is being confirmed. Ask and we will send today’s price the same day.'}
        </p>
      </div>
    );
  }

  const doAdd = () => {
    add(
      {
        slug: product.slug,
        name: product.name,
        modelCode: product.modelCode,
        image: product.image,
        withInstallation,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-input border border-oriel-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-oriel-navy transition-colors hover:bg-oriel-mist disabled:opacity-40"
            onClick={() => setQuantity((n) => Math.max(1, n - 1))}
            disabled={quantity <= 1}
          >
            <Minus size={16} strokeWidth={1.5} />
          </button>
          <span className="w-10 text-center font-mono text-data" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-oriel-navy transition-colors hover:bg-oriel-mist"
            onClick={() => setQuantity((n) => n + 1)}
          >
            <Plus size={16} strokeWidth={1.5} />
          </button>
        </div>
        <Button size="md" className="flex-1" onClick={doAdd}>
          {added ? (
            <>
              <Check size={18} strokeWidth={2} /> Added to basket
            </>
          ) : (
            'Add to basket'
          )}
        </Button>
      </div>
      <Button asChild variant="outline" size="md" className="w-full">
        <Link href="/cart" onClick={doAdd}>
          Buy now
        </Link>
      </Button>

      {installation && (
        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-card bg-oriel-green-soft p-4 text-small text-oriel-navy-ink'
          )}
        >
          <input
            type="checkbox"
            checked={withInstallation}
            onChange={(e) => setWithInstallation(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-oriel-green-deep"
          />
          <span>
            <span className="font-semibold">Add professional installation to this order.</span>{' '}
            Installation is quoted with your order, after a site survey, and confirmed in writing
            before any work is booked.
          </span>
        </label>
      )}
    </div>
  );
}
