'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COUNTIES } from '@/lib/counties';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)(7|1)\d{8}$/, "Check it's the right Kenyan number"),
  county: z.string().min(2, 'Choose your county'),
  need: z.string().min(2, 'Choose one'),
});

type FormValues = z.infer<typeof schema>;

const NEEDS = [
  'Home backup power',
  'Full solar for my home',
  'Solar for my business',
  'Farm or irrigation',
  'Solar water heating',
  'Street or estate lighting',
  'Something else',
];

/** The compact white call-back card inside the contact band. */
export function CallbackForm() {
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="rounded-card bg-oriel-white p-8 text-center shadow-oriel-lift">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green-soft text-oriel-green-deep">
          <Check size={24} strokeWidth={2} aria-hidden />
        </span>
        <h3 className="t-h3 mt-4 text-oriel-navy">Request received</h3>
        <p className="mt-2 text-small text-oriel-navy-ink">
          We&apos;ll call you back on the number you gave. If it&apos;s urgent, WhatsApp or call us
          directly.
        </p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={() => setStatus('idle')}>
          Send another request
        </Button>
      </div>
    );
  }

  const inputClass =
    'h-11 w-full rounded-input border border-oriel-line px-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-1';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-card bg-oriel-white p-6 shadow-oriel-lift"
    >
      <h3 className="t-h3 text-oriel-navy">Request a call back</h3>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="cb-name" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            Name
          </label>
          <input
            id="cb-name"
            autoComplete="name"
            aria-describedby={errors.name ? 'cb-name-error' : undefined}
            className={inputClass}
            {...register('name')}
          />
          {errors.name && (
            <p id="cb-name-error" className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
              {errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="cb-phone" className="mb-1 block text-small font-medium text-oriel-navy-ink">
            Phone
          </label>
          <input
            id="cb-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            aria-describedby={errors.phone ? 'cb-phone-error' : undefined}
            className={`${inputClass} font-mono`}
            {...register('phone')}
          />
          {errors.phone && (
            <p id="cb-phone-error" className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
              {errors.phone.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cb-county" className="mb-1 block text-small font-medium text-oriel-navy-ink">
              County
            </label>
            <select
              id="cb-county"
              defaultValue=""
              aria-describedby={errors.county ? 'cb-county-error' : undefined}
              className={inputClass}
              {...register('county')}
            >
              <option value="" disabled>
                Choose…
              </option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.county && (
              <p id="cb-county-error" className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
                {errors.county.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="cb-need" className="mb-1 block text-small font-medium text-oriel-navy-ink">
              What do you need?
            </label>
            <select
              id="cb-need"
              defaultValue=""
              aria-describedby={errors.need ? 'cb-need-error' : undefined}
              className={inputClass}
              {...register('need')}
            >
              <option value="" disabled>
                Choose…
              </option>
              {NEEDS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {errors.need && (
              <p id="cb-need-error" className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
                {errors.need.message}
              </p>
            )}
          </div>
        </div>
      </div>
      {status === 'error' && (
        <p className="mt-3 text-small text-oriel-navy-ink" aria-live="polite">
          We couldn&apos;t send that. Try again, or call 0723 204 342.
        </p>
      )}
      <Button type="submit" className="mt-4 w-full" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Request a call back'}
      </Button>
    </form>
  );
}
