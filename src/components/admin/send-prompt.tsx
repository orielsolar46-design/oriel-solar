'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Copy, Loader2, RefreshCw, Send } from 'lucide-react';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * Send a payment prompt — push an M-Pesa request to a pay-on-delivery customer
 * without waiting to be standing at their gate.
 *
 * It is the same request the handover screen sends, with the number and the
 * amount typed rather than assumed. The two rules the server enforces are drawn
 * rather than hidden: the amount can only be reduced, and a reduction needs a
 * reason recorded against the order. A person must be able to see why the send
 * button is disabled without guessing.
 */

type Phase =
  | { name: 'ready' }
  | { name: 'sending' }
  | { name: 'waiting'; checkoutRequestId: string; amount: number; elapsed: number }
  | { name: 'paid'; receipt: string | null; amount: number }
  | { name: 'failed'; message: string };

const MAX_ATTEMPTS = 3;

export function SendPrompt({
  orderNumber,
  customerName,
  total,
  phone,
  attemptsSoFar,
}: {
  orderNumber: string;
  customerName: string;
  total: number;
  phone: string;
  attemptsSoFar: number;
}) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>({ name: 'ready' });
  const [targetPhone, setTargetPhone] = React.useState(phone);
  const [amount, setAmount] = React.useState(total);
  const [reason, setReason] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [attempts, setAttempts] = React.useState(attemptsSoFar);

  const reduced = amount < total;
  const overTotal = amount > total;
  const needsReason = reduced && reason.trim().length < 3;
  const exhausted = attempts >= MAX_ATTEMPTS;

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
        setPhase({ name: 'failed', message: data.error ?? 'Could not send the prompt.' });
        return;
      }
      setAttempts((a) => a + 1);
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

  // Poll while the request is on the customer's handset.
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
      () => setPhase((p) => (p.name === 'waiting' ? { ...p, elapsed: p.elapsed + 1 } : p)),
      1000
    );
    void check();
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(timer);
    };
  }, [phase, router]);

  /* ---------------------------------------------------------------- states */

  if (phase.name === 'waiting') {
    return (
      <Shell orderNumber={orderNumber}>
        <div className="rounded-card border-2 border-oriel-gold bg-oriel-gold-soft p-5 text-center">
          <p className="font-headline text-[1.0625rem] font-semibold text-oriel-navy">Prompt sent</p>
          <p className="mt-1 text-small text-oriel-navy-ink">
            They should approve it on <span className="font-mono">{targetPhone}</span>
          </p>
          <p className="mt-3 font-mono text-[3.5rem] font-medium leading-none text-oriel-navy-ink">
            {formatKes(phase.amount)}
          </p>
          <p className="mt-3 font-mono text-small text-oriel-slate" aria-live="polite">
            {phase.elapsed}s · checking every 3 seconds
          </p>
        </div>
      </Shell>
    );
  }

  if (phase.name === 'paid') {
    return (
      <Shell orderNumber={orderNumber}>
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
          <Link
            href={`/admin/orders/${orderNumber}`}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-input border border-oriel-line bg-oriel-white text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
          >
            Back to the order
          </Link>
        </div>
      </Shell>
    );
  }

  if (phase.name === 'failed') {
    return (
      <Shell orderNumber={orderNumber}>
        <div className="rounded-card border border-oriel-line bg-oriel-white p-5">
          <p className="font-headline text-[1.0625rem] font-semibold text-oriel-navy">
            Payment not completed
          </p>
          <p className="mt-1 text-small text-oriel-navy-ink">{phase.message}</p>
          <button
            type="button"
            onClick={() => setPhase({ name: 'ready' })}
            disabled={exhausted}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-input bg-oriel-orange text-body-lg font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-60"
          >
            <RefreshCw size={18} strokeWidth={1.5} aria-hidden /> Try again
          </button>
        </div>
      </Shell>
    );
  }

  /* ----------------------------------------------------------------- ready */

  return (
    <Shell orderNumber={orderNumber}>
      <div className="flex items-center justify-between gap-4 rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest">
        <div className="min-w-0">
          <Link
            href={`/admin/orders/${orderNumber}`}
            className="block font-mono text-small font-medium text-oriel-navy hover:underline"
          >
            {orderNumber}
          </Link>
          <p className="truncate text-small text-oriel-navy-ink">{customerName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-small font-medium text-oriel-navy-ink">{formatKes(total)}</p>
          <p className="mt-1 text-eyebrow uppercase tracking-[0.12em] text-oriel-slate">
            Order total
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 rounded-card border border-oriel-line bg-oriel-white p-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="prompt-phone" className="text-small text-oriel-navy-ink">
            Send to
          </label>
          <input
            id="prompt-phone"
            inputMode="tel"
            value={targetPhone}
            onChange={(e) => setTargetPhone(e.target.value)}
            className="h-14 w-full rounded-input border border-oriel-line px-4 font-mono text-[1.25rem] text-oriel-navy-ink transition-all focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
          />
          <p className="text-micro text-oriel-slate">
            Pre-filled from the order. Change it if they are paying from another phone.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="prompt-amount" className="text-small text-oriel-navy-ink">
            Amount
          </label>
          <div
            className={cn(
              'flex h-14 items-center overflow-hidden rounded-input border bg-oriel-white transition-all focus-within:ring-2',
              overTotal
                ? 'border-oriel-orange focus-within:ring-oriel-orange-soft'
                : 'border-oriel-line focus-within:border-oriel-navy focus-within:ring-oriel-navy/20'
            )}
          >
            <span className="pl-4 pr-1 font-mono text-[1.25rem] text-oriel-slate" aria-hidden>
              KES
            </span>
            <input
              id="prompt-amount"
              inputMode="numeric"
              value={amount ? amount.toLocaleString('en-KE') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setAmount(digits ? Number.parseInt(digits, 10) : 0);
              }}
              className="h-full w-full border-none bg-transparent p-0 font-mono text-[1.5rem] font-medium text-oriel-navy-ink focus:outline-none focus:ring-0"
            />
          </div>
          {overTotal && (
            <p className="text-micro font-medium text-oriel-orange-deep">
              This cannot be more than the order total.
            </p>
          )}
        </div>

        {/* The reduce-only rule, drawn rather than hidden. */}
        {reduced && (
          <div className="flex flex-col gap-2">
            <p className="text-micro text-oriel-slate">
              The reason is recorded against the order.
            </p>
            <label htmlFor="prompt-reason" className="sr-only">
              Reason for the reduced amount
            </label>
            <input
              id="prompt-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (required)"
              className="h-12 w-full rounded-input border border-oriel-line px-4 text-small text-oriel-navy-ink transition-all focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
            />
          </div>
        )}

        {exhausted ? (
          <p className="rounded-input bg-oriel-gold-soft p-3 text-micro text-oriel-navy-ink">
            Three prompts have been sent for this order. Take payment another way, or wait before
            trying again.
          </p>
        ) : (
          <div>
            <button
              type="button"
              onClick={send}
              disabled={
                phase.name === 'sending' || amount < 1 || overTotal || needsReason
              }
              className="flex h-14 w-full items-center justify-center gap-2 rounded-input bg-oriel-orange text-body-lg font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase.name === 'sending' ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden /> Sending…
                </>
              ) : (
                <>
                  Send prompt — <span className="font-mono font-medium">{formatKes(amount)}</span>
                  <Send size={18} strokeWidth={1.5} aria-hidden />
                </>
              )}
            </button>
            {needsReason && (
              <p className="mt-2 text-center text-caption text-oriel-navy-ink">
                Enter a reason for the reduced amount before sending.
              </p>
            )}
            <p
              className={cn(
                'mt-3 text-center font-mono text-[0.6875rem] uppercase tracking-[0.12em]',
                attempts === MAX_ATTEMPTS - 1 ? 'text-oriel-orange-deep' : 'text-oriel-slate'
              )}
            >
              {attempts === MAX_ATTEMPTS - 1
                ? 'Last attempt'
                : `Attempt ${attempts + 1} of ${MAX_ATTEMPTS}`}
            </p>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Shell({ orderNumber, children }: { orderNumber: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={`/admin/orders/${orderNumber}`}
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate transition-colors hover:text-oriel-navy"
      >
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden /> Back to the order
      </Link>
      <h1 className="mt-4 font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
        Send a payment prompt
      </h1>
      <p className="mt-1 text-small text-oriel-slate">The customer approves it on their handset.</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
