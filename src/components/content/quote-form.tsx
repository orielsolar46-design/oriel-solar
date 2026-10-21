'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COUNTIES } from '@/lib/counties';

type Kind = 'quote' | 'survey' | 'warranty';

const COPY: Record<Kind, { submit: string; done: string; message: string }> = {
  quote: {
    submit: 'Request a quotation',
    done: "We have your request. An engineer will be in touch with a written quotation — usually within one working day.",
    message: 'What are you trying to power? Tell us about the site, your usage, and anything unusual.',
  },
  survey: {
    submit: 'Book a site survey',
    done: 'We have your request. We will call to arrange a convenient time for the survey.',
    message: 'Anything we should know before we come — access, roof type, what you want to run.',
  },
  warranty: {
    submit: 'Register my system',
    done: 'Registered. We now hold your details on file, so a warranty claim will be quick.',
    message: 'Product names and serial numbers, and the installation date if you know it.',
  },
};

const inputClass =
  'h-11 w-full rounded-input border border-oriel-line px-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-1';

export function QuoteForm({ kind = 'quote' }: { kind?: Kind }) {
  const params = useSearchParams();
  const prefilledProduct = params.get('product') ?? '';
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const copy = COPY[kind];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email') ?? '',
          county: form.get('county') ?? '',
          productSlug: prefilledProduct,
          orderNumber: form.get('orderNumber') ?? '',
          message: form.get('message') ?? '',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Something went wrong.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="rounded-card bg-oriel-green-soft p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green text-oriel-white">
          <Check size={24} strokeWidth={2.5} aria-hidden />
        </span>
        <p className="mt-3 text-body text-oriel-navy-ink">{copy.done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      {prefilledProduct && (
        <p className="rounded-input bg-oriel-orange-soft p-3 text-small text-oriel-navy">
          About: <span className="font-mono">{prefilledProduct}</span>
        </p>
      )}
      <div>
        <label htmlFor="q-name" className="mb-1 block text-small font-medium text-oriel-navy-ink">
          Name
        </label>
        <input id="q-name" name="name" autoComplete="name" required className={inputClass} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="q-phone" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            Phone
          </label>
          <input
            id="q-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            required
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label htmlFor="q-email" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            Email <span className="font-normal text-oriel-slate">(optional)</span>
          </label>
          <input id="q-email" name="email" type="email" autoComplete="email" className={inputClass} />
        </div>
      </div>

      {kind === 'warranty' ? (
        <div>
          <label htmlFor="q-order" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            Order number
          </label>
          <input
            id="q-order"
            name="orderNumber"
            placeholder="ORL-2607-00184"
            className={`${inputClass} font-mono`}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="q-county" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            County
          </label>
          <select id="q-county" name="county" defaultValue="" className={inputClass}>
            <option value="">Choose…</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="q-message" className="mb-1 block text-small font-medium text-oriel-navy-ink">
          Details
        </label>
        <textarea
          id="q-message"
          name="message"
          rows={4}
          placeholder={copy.message}
          className="w-full rounded-input border border-oriel-line p-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : copy.submit}
      </Button>
    </form>
  );
}
