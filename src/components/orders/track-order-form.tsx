'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/** Order lookup form for /track-order. */
export function TrackOrderForm() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "We couldn't find that order.");
        setBusy(false);
        return;
      }
      router.push(`/order/${data.orderNumber}?token=${data.accessToken}`);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setBusy(false);
    }
  };

  const inputClass =
    'h-11 w-full rounded-input border border-oriel-line px-3 font-mono text-data text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none';

  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-4">
      <div>
        <label htmlFor="track-number" className="mb-1 block text-small font-medium text-oriel-navy-ink">
          Order number
        </label>
        <input
          id="track-number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          placeholder="ORL-2607-00184"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="track-phone" className="mb-1 block text-small font-medium text-oriel-navy-ink">
          Phone number you ordered with
        </label>
        <input
          id="track-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          className={inputClass}
        />
      </div>
      {error && (
        <p className="rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? 'Looking…' : 'Find my order'}
      </Button>
    </form>
  );
}
