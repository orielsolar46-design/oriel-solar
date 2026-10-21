'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STOCK_LABELS, SUBCATEGORY_LABELS, buildShopQuery } from '@/lib/shop';
import { cn } from '@/lib/utils';

export type Facets = {
  subcategories: [string, number][];
  brands: [string, number][];
  availability: [string, number][];
  phases: [string, number][];
};

/**
 * Left filter rail (MASTERPLAN 7.2). Every control writes to the URL so
 * results are shareable and indexable; a drawer below lg.
 */
export function FilterRail({ facets }: { facets: Facets }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const current: Record<string, string | undefined> = {};
  params.forEach((v, k) => {
    current[k] = v;
  });

  const apply = (changes: Record<string, string | undefined>) => {
    router.push(`${pathname}${buildShopQuery(current, changes)}`, { scroll: false });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="border-t border-oriel-line py-4 first:border-t-0 first:pt-0">
      <legend className="pb-2 font-display text-[0.875rem] font-semibold text-oriel-navy">
        {title}
      </legend>
      {children}
    </fieldset>
  );

  const CheckRow = ({
    label,
    count,
    active,
    onClick,
  }: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex w-full items-center justify-between rounded-input px-2 py-1.5 text-left text-small transition-colors',
        active
          ? 'bg-oriel-orange-soft font-semibold text-oriel-navy'
          : 'text-oriel-navy-ink hover:bg-oriel-mist'
      )}
    >
      <span>{label}</span>
      <span className="font-mono text-micro text-oriel-slate">{count}</span>
    </button>
  );

  const [minPrice, setMinPrice] = React.useState(current.min ?? '');
  const [maxPrice, setMaxPrice] = React.useState(current.max ?? '');

  const rail = (
    <div className="space-y-0">
      <Section title="Type">
        {facets.subcategories.map(([value, count]) => (
          <CheckRow
            key={value}
            label={SUBCATEGORY_LABELS[value] ?? value}
            count={count}
            active={current.type === value}
            onClick={() => apply({ type: current.type === value ? undefined : value })}
          />
        ))}
      </Section>

      <Section title="Brand">
        {facets.brands.map(([value, count]) => (
          <CheckRow
            key={value}
            label={value}
            count={count}
            active={current.brand === value}
            onClick={() => apply({ brand: current.brand === value ? undefined : value })}
          />
        ))}
      </Section>

      {facets.phases.length > 1 && (
        <Section title="Phase">
          {facets.phases.map(([value, count]) => (
            <CheckRow
              key={value}
              label={value === 'three' ? 'Three phase' : 'Single phase'}
              count={count}
              active={current.phase === value}
              onClick={() => apply({ phase: current.phase === value ? undefined : value })}
            />
          ))}
        </Section>
      )}

      {/* No Availability facet. Filtering by stock state meant advertising
          stock state, which is exactly what we stopped doing. */}

      <Section title="Price (KES)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ min: minPrice || undefined, max: maxPrice || undefined });
          }}
        >
          <label className="sr-only" htmlFor="filter-min">
            Minimum price
          </label>
          <input
            id="filter-min"
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
            className="h-10 w-full rounded-input border border-oriel-line px-2 font-mono text-data text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
          />
          <span className="text-oriel-slate">–</span>
          <label className="sr-only" htmlFor="filter-max">
            Maximum price
          </label>
          <input
            id="filter-max"
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
            className="h-10 w-full rounded-input border border-oriel-line px-2 font-mono text-data text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
          />
          <Button type="submit" variant="outline" size="sm">
            Go
          </Button>
        </form>
      </Section>

      {(current.type || current.brand || current.phase || current.availability || current.min || current.max) && (
        <div className="border-t border-oriel-line pt-4">
          <Link
            href={pathname}
            className="text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2 hover:text-oriel-orange"
          >
            Clear all filters
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button variant="outline" size="sm" className="h-11" onClick={() => setOpen(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.5} /> Filters
        </Button>
        {open && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-oriel-navy-ink/50"
              onClick={() => setOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 w-[85vw] max-w-sm overflow-y-auto bg-oriel-white p-5 shadow-oriel-lift">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-h3 font-semibold text-oriel-navy">Filters</h2>
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-11 w-11 items-center justify-center rounded-input text-oriel-navy hover:bg-oriel-mist sm:h-10 sm:w-10"
                  onClick={() => setOpen(false)}
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              {rail}
            </div>
          </div>
        )}
      </div>

      {/* Desktop rail */}
      <div className="hidden w-[260px] shrink-0 lg:block">{rail}</div>
    </>
  );
}
