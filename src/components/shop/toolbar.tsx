'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, X } from 'lucide-react';
import { SORT_OPTIONS, STOCK_LABELS, SUBCATEGORY_LABELS, buildShopQuery } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * Listing toolbar (MASTERPLAN 7.2): result count, sort, grid/list toggle and
 * removable active-filter chips. All state lives in the URL.
 */
export function Toolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const current: Record<string, string | undefined> = {};
  params.forEach((v, k) => {
    current[k] = v;
  });

  const apply = (changes: Record<string, string | undefined>) =>
    router.push(`${pathname}${buildShopQuery(current, changes)}`, { scroll: false });

  const chips: { key: string; label: string }[] = [];
  if (current.type) chips.push({ key: 'type', label: SUBCATEGORY_LABELS[current.type] ?? current.type });
  if (current.brand) chips.push({ key: 'brand', label: current.brand });
  if (current.phase)
    chips.push({ key: 'phase', label: current.phase === 'three' ? 'Three phase' : 'Single phase' });
  if (current.min) chips.push({ key: 'min', label: `From KES ${current.min}` });
  if (current.max) chips.push({ key: 'max', label: `To KES ${current.max}` });

  const view = current.view === 'list' ? 'list' : 'grid';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-oriel-slate">
          <span className="font-mono font-medium text-oriel-navy-ink">{total}</span>{' '}
          {total === 1 ? 'product' : 'products'}
        </p>
        {/* Wraps: at 360px the sort control and the view toggle cannot sit on
            one line beside the result count without overflowing the page. */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <label htmlFor="shop-sort" className="text-small text-oriel-slate">
            Sort
          </label>
          <select
            id="shop-sort"
            value={current.sort ?? 'relevance'}
            onChange={(e) => apply({ sort: e.target.value === 'relevance' ? undefined : e.target.value })}
            className="h-11 min-w-0 max-w-[9.5rem] sm:h-10 rounded-input border border-oriel-line bg-oriel-white px-2 text-small text-oriel-navy-ink focus:border-oriel-navy focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 rounded-input border border-oriel-line" role="group" aria-label="View">
            <button
              type="button"
              aria-pressed={view === 'grid'}
              aria-label="Grid view"
              onClick={() => apply({ view: undefined })}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-l-input transition-colors sm:h-10 sm:w-10',
                view === 'grid' ? 'bg-oriel-navy text-oriel-white' : 'text-oriel-navy hover:bg-oriel-mist'
              )}
            >
              <LayoutGrid size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-pressed={view === 'list'}
              aria-label="List view"
              onClick={() => apply({ view: 'list' })}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-r-input transition-colors sm:h-10 sm:w-10',
                view === 'list' ? 'bg-oriel-navy text-oriel-white' : 'text-oriel-navy hover:bg-oriel-mist'
              )}
            >
              <List size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => apply({ [chip.key]: undefined })}
                className="inline-flex items-center gap-1.5 rounded-pill bg-oriel-orange-soft px-3 py-1.5 text-caption font-semibold text-oriel-navy transition-colors hover:bg-oriel-orange hover:text-oriel-white"
              >
                {chip.label}
                <X size={13} strokeWidth={2} aria-hidden />
                <span className="sr-only">Remove filter</span>
              </button>
            </li>
          ))}
          <li>
            <Link
              href={pathname}
              className="text-caption font-medium text-oriel-slate underline underline-offset-2 hover:text-oriel-navy"
            >
              Clear all
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
