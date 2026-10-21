'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { MpesaMark } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { formatKes } from '@/lib/shop';

/**
 * The M-Pesa waiting experience (MASTERPLAN 10.3 steps 4–8).
 *
 * The pulsing sun arc is the arc's fifth and final permitted appearance.
 * The page polls every 4 seconds; resolution comes from the callback, and the
 * server runs the status-query fallback after 150s before declaring failure.
 */

type State =
  | { phase: 'idle' }
  | { phase: 'pushing' }
  | { phase: 'waiting'; checkoutRequestId: string; secondsLeft: number }
  | { phase: 'paid'; receipt: string | null }
  | { phase: 'failed'; message: string };

export function PaymentPanel({
  orderNumber,
  token,
  amount,
  phone,
  initiallyPaid,
}: {
  orderNumber: string;
  token: string;
  amount: number;
  phone: string;
  initiallyPaid: boolean;
}) {
  const [state, setState] = React.useState<State>(
    initiallyPaid ? { phase: 'paid', receipt: null } : { phase: 'idle' }
  );
  const [useOtherNumber, setUseOtherNumber] = React.useState(false);
  const [otherNumber, setOtherNumber] = React.useState('');

  const startPush = React.useCallback(
    async (msisdn?: string) => {
      setState({ phase: 'pushing' });
      try {
        const res = await fetch('/api/mpesa/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNumber, token, msisdn }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setState({ phase: 'failed', message: data.error ?? "We couldn't start the payment." });
          return;
        }
        setState({ phase: 'waiting', checkoutRequestId: data.checkoutRequestId, secondsLeft: 120 });
      } catch {
        setState({
          phase: 'failed',
          message: "We couldn't reach the server. Check your connection and try again.",
        });
      }
    },
    [orderNumber, token]
  );

  // Poll every 4 seconds while waiting.
  React.useEffect(() => {
    if (state.phase !== 'waiting') return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/mpesa/status/${state.checkoutRequestId}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled || !data.ok) return;
        if (data.state === 'paid') {
          setState({ phase: 'paid', receipt: data.receipt ?? null });
        } else if (data.state === 'failed' || data.state === 'cancelled') {
          setState({
            phase: 'failed',
            message: data.resultDesc
              ? `${data.resultDesc}. Nothing has been charged.`
              : 'The payment did not complete. Nothing has been charged.',
          });
        }
      } catch {
        // Transient network error — keep polling.
      }
    };

    const poll = setInterval(tick, 4000);
    const countdown = setInterval(() => {
      setState((prev) =>
        prev.phase === 'waiting'
          ? { ...prev, secondsLeft: Math.max(0, prev.secondsLeft - 1) }
          : prev
      );
    }, 1000);
    void tick();

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(countdown);
    };
  }, [state]);

  if (state.phase === 'paid') {
    return (
      <div className="rounded-card bg-oriel-green-soft p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green text-oriel-white">
          <Check size={24} strokeWidth={2.5} aria-hidden />
        </span>
        <h2 className="t-h3 mt-3 text-oriel-green-deep">Payment received</h2>
        <p className="mt-1 text-small text-oriel-navy-ink">
          {formatKes(amount)} paid by M-Pesa. Your order is now being prepared.
        </p>
        {state.receipt && (
          <p className="mt-2 font-mono text-data text-oriel-navy-ink">Receipt {state.receipt}</p>
        )}
      </div>
    );
  }

  if (state.phase === 'waiting') {
    return (
      <div className="rounded-card border border-oriel-line bg-oriel-white p-6 text-center">
        {/* Pulsing sun arc */}
        <div className="mx-auto w-44" aria-hidden>
          <svg viewBox="0 0 200 110" className="block w-full">
            <defs>
              <linearGradient id="wait-arc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FDB913" />
                <stop offset="100%" stopColor="#F26A21" />
              </linearGradient>
            </defs>
            <line x1="10" y1="100" x2="190" y2="100" stroke="#3FA535" strokeWidth="2" />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              stroke="url(#wait-arc)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              className="mpesa-arc-pulse"
            />
          </svg>
        </div>

        <h2 className="t-h3 mt-2">Check your phone</h2>
        <p className="mt-2 font-mono text-h2 font-medium text-oriel-navy-ink">
          {formatKes(amount)}
        </p>
        <p className="mt-1 font-mono text-small text-oriel-slate">{phone}</p>

        <ol className="mx-auto mt-5 max-w-xs space-y-2 text-left text-small text-oriel-navy-ink">
          {[
            'An M-Pesa request has been sent to your phone.',
            'Enter your M-Pesa PIN to approve it.',
            'This page updates itself — no need to refresh.',
          ].map((step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-oriel-gold-soft font-mono text-[0.6875rem] font-medium text-oriel-navy-ink">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>

        <p className="mt-5 font-mono text-small text-oriel-slate" aria-live="polite">
          {state.secondsLeft > 0
            ? `Waiting — ${state.secondsLeft}s`
            : 'Still checking with M-Pesa…'}
        </p>
      </div>
    );
  }

  if (state.phase === 'failed') {
    return (
      <div className="rounded-card border border-oriel-line bg-oriel-white p-6">
        <h2 className="t-h3">Payment didn&apos;t go through</h2>
        <p className="mt-2 text-small text-oriel-navy-ink">{state.message}</p>
        <div className="mt-5 space-y-3">
          <Button className="w-full" onClick={() => startPush()}>
            Try again
          </Button>
          {useOtherNumber ? (
            <div className="flex gap-2">
              <label htmlFor="other-msisdn" className="sr-only">
                Different M-Pesa number
              </label>
              <input
                id="other-msisdn"
                type="tel"
                inputMode="tel"
                value={otherNumber}
                onChange={(e) => setOtherNumber(e.target.value)}
                placeholder="07XX XXX XXX"
                className="h-11 min-w-0 flex-1 rounded-input border border-oriel-line px-3 font-mono text-data focus:border-oriel-navy focus:outline-none"
              />
              <Button variant="outline" onClick={() => startPush(otherNumber)}>
                Send
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setUseOtherNumber(true)}>
              Use a different number
            </Button>
          )}
        </div>
      </div>
    );
  }

  // idle / pushing
  return (
    <div className="rounded-card border border-oriel-line bg-oriel-white p-6 text-center">
      <MpesaMark height={26} className="justify-center" />
      <h2 className="t-h3 mt-3">Pay by M-Pesa</h2>
      <p className="mt-1 text-small text-oriel-navy-ink">
        We&apos;ll send a request for{' '}
        <span className="font-mono font-medium">{formatKes(amount)}</span> to{' '}
        <span className="font-mono">{phone}</span>.
      </p>
      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={state.phase === 'pushing'}
        onClick={() => startPush()}
      >
        {state.phase === 'pushing' ? 'Sending the request…' : 'Send the M-Pesa request'}
      </Button>
    </div>
  );
}
