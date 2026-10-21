'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { formatKes } from '@/lib/shop';

export type CompatItem = {
  slug: string;
  name: string;
  modelCode: string | null;
  category: string;
  image: string | null;
  retailPrice: number | null;
};

/**
 * "Completes this system" (MASTERPLAN 6.5): curated compatible items with
 * checkboxes and a single Add-all action. Only electrically valid pairings
 * reach this list — the curation happens in the catalogue data.
 */
export function CompletesSystem({ items }: { items: CompatItem[] }) {
  const { add } = useCart();
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(items.filter((i) => i.retailPrice != null).map((i) => i.slug))
  );
  const [added, setAdded] = React.useState(false);

  if (items.length === 0) return null;

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const addable = items.filter((i) => selected.has(i.slug) && i.retailPrice != null);

  return (
    <section aria-labelledby="completes-heading" className="border-t border-oriel-line py-10">
      <h2 id="completes-heading" className="t-h2 text-oriel-navy">
        Completes this system
      </h2>
      <p className="mt-1 text-small text-oriel-slate">
        Verified pairings only — matching voltage class and connectors.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.slice(0, 4).map((item) => {
          const isSelected = selected.has(item.slug);
          const priced = item.retailPrice != null;
          return (
            <label
              key={item.slug}
              className={`flex cursor-pointer items-start gap-3 rounded-card border p-3 transition-colors ${
                isSelected ? 'border-oriel-orange bg-oriel-orange-soft' : 'border-oriel-line bg-oriel-white hover:border-oriel-navy'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={!priced}
                onChange={() => toggle(item.slug)}
                className="mt-1 h-4 w-4 accent-oriel-orange"
                aria-label={`Include ${item.name}`}
              />
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-input border border-oriel-line bg-oriel-white">
                <Image
                  src={item.image ?? '/products/placeholder.svg'}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </span>
              <span className="min-w-0">
                <Link
                  href={`/shop/${item.category}/${item.slug}`}
                  className="block text-caption font-semibold leading-snug text-oriel-navy hover:text-oriel-orange"
                >
                  {item.name}
                </Link>
                <span className="mt-0.5 block font-mono text-micro text-oriel-navy-ink">
                  {priced ? formatKes(item.retailPrice!) : 'Price being confirmed'}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {addable.length > 0 && (
        <Button
          className="mt-4"
          onClick={() => {
            for (const item of addable) {
              add({
                slug: item.slug,
                name: item.name,
                modelCode: item.modelCode,
                image: item.image,
                withInstallation: false,
              });
            }
            setAdded(true);
            setTimeout(() => setAdded(false), 1600);
          }}
        >
          {added ? (
            <>
              <Check size={16} strokeWidth={2} /> Added to basket
            </>
          ) : (
            `Add ${addable.length} ${addable.length === 1 ? 'item' : 'items'} to basket`
          )}
        </Button>
      )}
    </section>
  );
}
