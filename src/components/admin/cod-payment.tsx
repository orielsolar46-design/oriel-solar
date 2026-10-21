'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Pencil, RefreshCw } from 'lucide-react';
import { MpesaMark } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { formatKes } from '@/lib/shop';

/**
 * The pay-on-delivery payment trigger (MASTERPLAN 10.4).
 *
 * THIS SCREEN IS USED ONE-HANDED, ON A PHONE, AT A CUSTOMER'S GATE.
 * Everything below is sized for that: a 56px primary button, large mono
 * figures, a live status card that refreshes every 3 seconds, and a receipt
 * code big enough to read back out loud with a one-tap copy.
 */

type Phase =
  | { name: 'ready' }
  | { name: 'sending' }
  | { name: 'waiting'; checkoutRequestId: string; amount: number; elapsed: number }
  | { name: 'paid'; receipt: string | null; amount: number }
  | { name: 'failed'; message: string };

export function CodPayment({
  orderNumber,
  total,
  phone,
  alreadyPaid,
  paidReceipt,
  canDeliver,
}: {
  orderNumber: string;
  total: number;
  phone: string;
  alreadyPaid: boolean;
  paidReceipt: string | null;
  canDeliver: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>(
    alreadyPaid ? { name: 'paid', receipt: paidReceipt, amount: total } : { name: 'ready' }
  );
  const [editing, setEditing] = React.useState(false);
  const [amount, setAmount] = React.useState(total);
  const [reason, setReason] = React.useState('');
  const [targetPhone, setTargetPhone] = React.useState(phone);
  const [copied, setCopied] = React.useState(false);
  const [delivering, setDelivering] = React.useState(false);

  const send = async () => {
    setPhase({ name: 'sending' });
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/request-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(amount !== total ? { amount, amountChangeReason: reason } : {}),
          ...(targetPhone !== phone ? { msisdn: targetPhone } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPhase({ name: 'failed', message: data.error ?? 'Could not send the request.' });
        return;
      }
      setPhase({
        name: 'waiting',
        checkoutRequestId: data.checkoutRequestId,
        amount: data.amount,
        elapsed: 0,
      });
    } catch {
      setPhase({ name: 'failed', message: 'Could not reach the server. Check your signal.' });
    }
  };

  // Live status card, refreshing every 3 seconds while waiting.
  React.useEffect(() => {
    if (phase.name !== 'waiting') return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/api/mpesa/status/${phase.checkoutRequestId}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled || !data.ok) return;
        if (data.state === 'paid') {
          setPhase({ name: 'paid', receipt: data.receipt ?? null, amount: phase.amount });
          router.refresh();
        } else if (data.state === 'failed' || data.state === 'cancelled') {
          setPhase({
            name: 'failed',
            message: data.resultDesc
              ? `${data.resultDesc}.`
              : 'The customer did not complete the payment.',
          });
        }
      } catch {
        // keep polling
      }
    };

    const poll = setInterval(check, 3000);
    const timer = setInterval(
      () =>
        setPhase((p) => (p.name === 'waiting' ? { ...p, elapsed: p.elapsed + 1 } : p)),
      1000
    );
    void check();
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(timer);
    };
  }, [phase, router]);

  const markDelivered = async () => {
    setDelivering(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', note: 'Handed over to the customer' }),
      });
      if (res.ok) router.refresh();
    } finally {
      setDelivering(false);
    }
  };

  if (phase.name === 'paid') {
    return (
      <div className="rounded-card border-2 border-oriel-green bg-oriel-green-soft p-5">
        <div className="flex flex-col items-center text-center">
          <span
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green text-oriel-white"
            aria-hidden
          >
            <Check size={24} strokeWidth={3} />
          </span>
          <p className="font-headline text-[1.0625rem] font-semibold text-oriel-green-deep">
            Payment received
          </p>
          <p className="mt-2 font-mono text-h2 font-medium tracking-tight text-oriel-green-deep">
            {formatKes(phase.amount)}
          </p>
        </div>
        {phase.receipt && (
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-center text-[0.6875rem] uppercase tracking-wider text-oriel-green-deep opacity-80">
              M-Pesa receipt — read this back to the customer
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(phase.receipt ?? '');
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex h-14 w-full items-center justify-between gap-3 rounded-input border border-oriel-green/20 bg-oriel-white px-4 shadow-oriel-rest"
            >
              <span className="font-mono text-h3 font-medium uppercase tracking-widest text-oriel-navy-ink">
                {phase.receipt}
              </span>
              {copied ? (
                <Check size={20} strokeWidth={2} className="text-oriel-green-deep" aria-hidden />
              ) : (
                <Copy size={20} strokeWidth={1.5} className="text-oriel-slate" aria-hidden />
              )}
              <span className="sr-only">Copy receipt code</span>
            </button>
          </div>
        )}

        {canDeliver && (
          <Button
            variant="confirm"
            className="mt-6 h-14 w-full text-body-lg"
            onClick={markDelivered}
            disabled={delivering}
          >
            {delivering ? 'Saving…' : 'Mark as delivered'}
          </Button>
        )}
      </div>
    );
  }

  if (phase.name === 'waiting') {
    return (
      <div className="rounded-card border-2 border-oriel-gold bg-oriel-gold-soft p-5 text-center">
        <p className="font-headline text-[1.0625rem] font-semibold text-oriel-navy">
          Waiting for the customer
        </p>
        <p className="mt-1 text-small text-oriel-navy-ink">
          They should approve the M-Pesa request on {targetPhone}
        </p>
        <p className="mt-3 font-mono text-display font-medium leading-none text-oriel-navy-ink">
          {formatKes(phase.amount)}
        </p>
        <p className="mt-3 font-mono text-small text-oriel-slate" aria-live="polite">
          {phase.elapsed}s · checking every 3 seconds
        </p>
      </div>
    );
  }

  if (phase.name === 'failed') {
    return (
      <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
        <p className="font-headline text-[1.0625rem] font-semibold text-oriel-navy">
          Payment not completed
        </p>
        <p className="mt-1 text-small text-oriel-navy-ink">{phase.message}</p>
        <Button className="mt-4 h-14 w-full text-body-lg" onClick={() => setPhase({ name: 'ready' })}>
          <RefreshCw size={18} strokeWidth={1.5} /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
      <p className="flex items-center gap-2 font-headline text-[1.0625rem] font-semibold text-oriel-navy">
        <MpesaMark height={16} /> Take payment at handover
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 border-b border-oriel-line pb-4">
          <span className="text-small text-oriel-slate">Amount</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-h3 font-medium text-oriel-navy-ink">
              {formatKes(amount)}
            </span>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              aria-label="Change amount"
              className="flex h-9 w-9 items-center justify-center rounded-input border border-oriel-line bg-oriel-white text-oriel-slate shadow-oriel-rest transition-colors hover:border-oriel-navy hover:text-oriel-navy"
            >
              <Pencil size={16} strokeWidth={1.5} />
            </button>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-small text-oriel-slate">To</span>
          <span className="font-mono text-small text-oriel-navy-ink">{targetPhone}</span>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-2 rounded-input bg-oriel-mist p-3">
          <p className="text-micro text-oriel-slate">
            The amount can only be reduced, and the reason is recorded against the order.
          </p>
          <label htmlFor="cod-amount" className="sr-only">
            Amount
          </label>
          <input
            id="cod-amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10);
              setAmount(Number.isFinite(n) ? Math.min(n, total) : 0);
            }}
            className="h-12 w-full rounded-input border border-oriel-line px-3 font-mono text-data"
          />
          <label htmlFor="cod-reason" className="sr-only">
            Reason for the change
          </label>
          <input
            id="cod-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (required)"
            className="h-12 w-full rounded-input border border-oriel-line px-3 text-small"
          />
          <label htmlFor="cod-phone" className="sr-only">
            Different phone number
          </label>
          <input
            id="cod-phone"
            inputMode="tel"
            value={targetPhone}
            onChange={(e) => setTargetPhone(e.target.value)}
            placeholder="Different M-Pesa number"
            className="h-12 w-full rounded-input border border-oriel-line px-3 font-mono text-data"
          />
        </div>
      )}

      <Button
        className="mt-6 h-14 w-full text-body-lg"
        onClick={send}
        disabled={
          phase.name === 'sending' || amount < 1 || (amount !== total && reason.trim().length < 3)
        }
      >
        {phase.name === 'sending' ? (
          'Sending…'
        ) : (
          <>
            Request payment — <span className="font-mono font-medium">{formatKes(amount)}</span>
          </>
        )}
      </Button>
      {amount !== total && reason.trim().length < 3 && (
        <p className="mt-2 text-center text-caption text-oriel-navy-ink">
          Enter a reason for the reduced amount before sending.
        </p>
      )}
    </div>
  );
}
