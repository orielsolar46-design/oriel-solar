'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Boxes, Check, EyeOff, Loader2, PackageX, Pencil, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Row controls on the admin product list: mark out of stock, put it back, and
 * take it off the shop.
 *
 * Every action is a single tap with no confirmation dialog except removal,
 * because these get used standing in a store room on a phone. Removal is the
 * one that needs a beat of thought, so it asks.
 *
 * The row re-reads from the server after each change (`router.refresh()`)
 * rather than trusting local state — the value shown is always the value in
 * the database.
 */
export function ProductActions({
  slug,
  stockStatus,
  isPublished,
}: {
  slug: string;
  stockStatus: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const outOfStock = stockStatus === 'out_of_stock';

  const send = async (label: string, init: RequestInit, url = `/api/admin/products/${slug}`) => {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(url, init);
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? 'That did not work.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(null);
    }
  };

  const patch = (label: string, body: Record<string, unknown>) =>
    send(label, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const remove = () => {
    if (!window.confirm('Take this off the shop? It stays in your records and can be put back.')) {
      return;
    }
    send('remove', { method: 'DELETE' });
  };

  const Btn = ({
    id,
    onClick,
    children,
    tone = 'plain',
  }: {
    id: string;
    onClick: () => void;
    children: React.ReactNode;
    tone?: 'plain' | 'warn';
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy !== null}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-input border px-2.5 py-1.5 text-micro font-semibold transition-colors disabled:opacity-50',
        tone === 'warn'
          ? 'border-oriel-line text-oriel-navy-ink hover:bg-oriel-gold-soft'
          : 'border-oriel-line text-oriel-navy hover:bg-oriel-mist'
      )}
    >
      {busy === id ? <Loader2 size={13} className="animate-spin" aria-hidden /> : children}
    </button>
  );

  return (
    <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
      {/* Four buttons do not fit one line on a 360px phone, so they wrap from
          the left there and only right-align once there is room. */}
      <div className="flex flex-wrap gap-1.5 sm:justify-end">
        {/* The two quick-edit screens. They lead the row because changing a
            price or counting a shelf is what this list is opened for. */}
        <Link
          href={`/admin/products/${slug}/edit`}
          className="inline-flex items-center gap-1.5 rounded-input border border-oriel-line px-2.5 py-1.5 text-micro font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
        >
          <Pencil size={13} strokeWidth={2} aria-hidden /> Edit
        </Link>
        <Link
          href={`/admin/products/${slug}/stock`}
          className="inline-flex items-center gap-1.5 rounded-input border border-oriel-line px-2.5 py-1.5 text-micro font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
        >
          <Boxes size={13} strokeWidth={2} aria-hidden /> Stock
        </Link>

        {outOfStock ? (
          <Btn id="in" onClick={() => patch('in', { stockStatus: 'in_stock' })}>
            <Check size={13} strokeWidth={2} aria-hidden /> Back in stock
          </Btn>
        ) : (
          <Btn id="out" tone="warn" onClick={() => patch('out', { stockStatus: 'out_of_stock' })}>
            <PackageX size={13} strokeWidth={2} aria-hidden /> Out of stock
          </Btn>
        )}

        {isPublished ? (
          <Btn id="remove" onClick={remove}>
            <EyeOff size={13} strokeWidth={2} aria-hidden /> Remove
          </Btn>
        ) : (
          <Btn id="publish" onClick={() => patch('publish', { isPublished: true })}>
            <RotateCcw size={13} strokeWidth={2} aria-hidden /> Put back
          </Btn>
        )}
      </div>

      {error && (
        <p role="alert" className="max-w-[16rem] text-micro text-oriel-navy-ink sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
