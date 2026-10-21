'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommitBar } from '@/components/admin/commit-bar';

/**
 * Set stock — how many of a thing are actually on the shelf.
 *
 * The count and the shop-facing state are edited together because they are one
 * fact told two ways, and they are kept honest in front of the person: a count
 * of zero snaps the state to out of stock, and choosing out of stock zeroes the
 * count. The server does the same thing on write, so the two cannot drift even
 * if this screen is bypassed.
 */

const STATES = [
  { id: 'in_stock', label: 'In stock' },
  { id: 'low_stock', label: 'Low stock' },
  { id: 'on_order', label: 'On order' },
  { id: 'call_for_stock', label: 'Call for stock' },
];

export function SetStock({
  slug,
  name,
  initialQty,
  initialState,
}: {
  slug: string;
  name: string;
  initialQty: number | null;
  initialState: string;
}) {
  const router = useRouter();
  const [qty, setQty] = React.useState<number | null>(initialQty);
  const [state, setState] = React.useState(initialState);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const outOfStock = qty === 0;

  const setCount = (next: number | null) => {
    setQty(next);
    // A thing with none of it left is not "in stock", whatever anyone clicked.
    if (next === 0) setState('out_of_stock');
    else if (state === 'out_of_stock') setState('in_stock');
  };

  const chooseState = (id: string) => {
    setState(id);
    if (id === 'out_of_stock') setQty(0);
  };

  const changes: string[] = [];
  if (qty !== initialQty) {
    changes.push(`${initialQty ?? '—'} → ${qty ?? '—'} in stock`);
  }
  if (state !== initialState) {
    changes.push(
      (STATES.find((s) => s.id === state)?.label ?? 'Out of stock').toLowerCase()
    );
  }

  const commit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQty: qty, stockStatus: state }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'That change was not saved.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your signal.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-card border border-oriel-line bg-oriel-white p-6 text-center">
          <span
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green text-oriel-white"
            aria-hidden
          >
            <Check size={24} strokeWidth={3} />
          </span>
          <p className="font-headline text-[1.0625rem] font-semibold text-oriel-green-deep">Saved</p>
          <p className="mt-2 font-mono text-small text-oriel-navy-ink">
            {qty ?? '—'} in stock
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/admin/inventory"
              className="flex h-12 items-center justify-center rounded-input bg-oriel-orange px-5 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
            >
              Back to stock
            </Link>
            <Link
              href="/admin/products"
              className="flex h-12 items-center justify-center rounded-input border border-oriel-line bg-oriel-white px-5 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
            >
              Back to products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-32">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate transition-colors hover:text-oriel-navy"
      >
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden /> All products
      </Link>

      <h1 className="mt-4 font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
        Set stock
      </h1>
      <p className="mt-1 truncate text-small text-oriel-slate">{name}</p>

      <div className="mt-6 flex flex-col items-center rounded-card border border-oriel-line bg-oriel-white p-5">
        <p className="mb-6 text-eyebrow font-semibold uppercase tracking-[0.12em] text-oriel-slate">
          How many are on the shelf
        </p>

        <div className="mb-8 flex w-full max-w-xs items-center justify-center gap-6">
          <button
            type="button"
            aria-label="One fewer"
            onClick={() => setCount(Math.max(0, (qty ?? 0) - 1))}
            className="flex h-14 w-14 items-center justify-center rounded-pill border border-oriel-line bg-oriel-white text-oriel-navy shadow-oriel-rest transition-colors hover:bg-oriel-mist"
          >
            <Minus size={26} strokeWidth={1.5} aria-hidden />
          </button>
          <span className="min-w-[5rem] text-center font-mono text-[3rem] font-medium leading-none text-oriel-navy">
            {qty ?? '—'}
          </span>
          <button
            type="button"
            aria-label="One more"
            onClick={() => setCount((qty ?? 0) + 1)}
            className="flex h-14 w-14 items-center justify-center rounded-pill border border-oriel-line bg-oriel-white text-oriel-navy shadow-oriel-rest transition-colors hover:bg-oriel-mist"
          >
            <Plus size={26} strokeWidth={1.5} aria-hidden />
          </button>
        </div>

        <label htmlFor="stock-qty" className="sr-only">
          Stock quantity
        </label>
        <input
          id="stock-qty"
          inputMode="numeric"
          value={qty ?? ''}
          placeholder="—"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            setCount(digits ? Math.min(100000, Number.parseInt(digits, 10)) : null);
          }}
          className="h-11 w-full max-w-xs rounded-input border border-oriel-line bg-oriel-white px-4 text-center font-mono text-data text-oriel-navy transition-all focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
        />

        {initialQty == null && (
          <p className="mt-3 text-micro text-oriel-slate">Never counted.</p>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-eyebrow font-semibold uppercase tracking-[0.12em] text-oriel-slate">
          Shown on the shop as
        </p>
        <div className="flex flex-wrap gap-3">
          {outOfStock ? (
            <span className="flex h-10 items-center rounded-pill bg-oriel-navy px-5 text-small font-medium text-oriel-white">
              Out of stock
            </span>
          ) : (
            STATES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => chooseState(s.id)}
                className={cn(
                  'flex h-10 items-center rounded-pill px-5 text-small font-medium transition-all',
                  state === s.id
                    ? 'bg-oriel-navy text-oriel-white'
                    : 'border border-oriel-line bg-oriel-white text-oriel-navy-ink hover:bg-oriel-mist'
                )}
              >
                {s.label}
              </button>
            ))
          )}
        </div>
        <p className="mt-3 text-micro text-oriel-slate">
          A count of zero always shows as out of stock.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
          {error}
        </p>
      )}

      <CommitBar
        changeCount={changes.length}
        summary={changes.join(' · ')}
        onCommit={commit}
        saving={saving}
      />
    </div>
  );
}
