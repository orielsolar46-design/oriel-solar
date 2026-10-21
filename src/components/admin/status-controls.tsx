'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  pending_payment: [
    { status: 'cancelled', label: 'Cancel order' },
  ],
  paid: [
    { status: 'processing', label: 'Start picking' },
    { status: 'cancelled', label: 'Cancel order' },
  ],
  payment_failed: [{ status: 'cancelled', label: 'Cancel order' }],
  pending_cod: [
    { status: 'processing', label: 'Start picking' },
    { status: 'cancelled', label: 'Cancel order' },
  ],
  processing: [{ status: 'out_for_delivery', label: 'Mark out for delivery' }],
  out_for_delivery: [{ status: 'delivered', label: 'Mark delivered' }],
};

export function StatusControls({
  orderNumber,
  status,
}: {
  orderNumber: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const options = NEXT_STEPS[status] ?? [];

  if (options.length === 0) return null;

  const move = async (next: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'That change was not allowed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.status}
            variant={option.status === 'cancelled' ? 'destructive' : 'outline'}
            size="md"
            disabled={busy}
            onClick={() => move(option.status)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      {error && (
        <p className="mt-2 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
