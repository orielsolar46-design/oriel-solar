'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store, Wrench } from 'lucide-react';
import { DeliveryIcon, MpesaMark } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/cart/cart-provider';
import { checkoutSchema, normaliseMsisdn, type CheckoutValues } from '@/lib/checkout-schema';
import { COUNTIES } from '@/lib/counties';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';

const inputClass =
  'h-11 w-full rounded-input border border-oriel-line px-3 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-1';

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-small font-medium text-oriel-navy-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-oriel-slate">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ subtotal }: { subtotal: number }) {
  const router = useRouter();
  const { lines, clear, destination } = useCart();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const phoneRef = React.useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      isBusiness: false,
      deliveryMethod: 'delivery',
      withInstallation: lines.some((l) => l.withInstallation),
      paymentOption: 'pay_now',
      county: '',
      town: '',
    },
  });

  // The basket asked where this is going; carry that answer over rather than
  // asking twice. It arrives a tick late because the basket hydrates from
  // localStorage in an effect, so this fills the fields once it lands — and
  // never overwrites something the buyer has already typed here.
  const county = watch('county');
  const town = watch('town');
  React.useEffect(() => {
    if (destination.county && !county) setValue('county', destination.county);
    if (destination.place && !town) setValue('town', destination.place);
    // Only re-run when the stored destination changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination.county, destination.place]);

  const isBusiness = watch('isBusiness');
  const deliveryMethod = watch('deliveryMethod');
  const paymentOption = watch('paymentOption');
  const phoneRaw = watch('phone') ?? '';
  const msisdn = normaliseMsisdn(`+254${phoneRaw}`) ?? normaliseMsisdn(phoneRaw);

  // Arc progress: panels complete as their required fields validate.
  const detailsDone = Boolean(watch('customerName') && msisdn);
  const deliveryDone =
    deliveryMethod === 'collection' || Boolean(county && town);
  const progress = 0.15 + (detailsDone ? 0.3 : 0) + (deliveryDone ? 0.25 : 0) + 0.15;

  const onSubmit = async (details: CheckoutValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          details: { ...details, phone: `+254${details.phone.replace(/^\+?254|^0/, '')}` },
          lines: lines.map((l) => ({
            slug: l.slug,
            quantity: l.quantity,
            withInstallation: l.withInstallation,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSubmitError(data.error ?? "We couldn't place the order. Try again.");
        setSubmitting(false);
        return;
      }
      clear();
      router.push(`/order/${data.orderNumber}?token=${data.accessToken}`);
    } catch {
      setSubmitError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  const { ref: phoneFieldRef, ...phoneReg } = register('phone');

  return (
    <div>
      {/* Sun arc as checkout progress — its fourth permitted appearance */}
      <div className="mx-auto w-full max-w-sm" aria-hidden>
        <svg viewBox="0 0 400 90" className="block w-full">
          <defs>
            <linearGradient id="checkout-arc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#F26A21" />
            </linearGradient>
          </defs>
          <line x1="10" y1="82" x2="390" y2="82" stroke="#3FA535" strokeWidth="2" />
          <path d="M 20 82 Q 200 -30 380 82" stroke="#DCE3F0" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path
            d="M 20 82 Q 200 -30 380 82"
            stroke="url(#checkout-arc)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - Math.min(progress, 1)}
            style={{ transition: 'stroke-dashoffset 400ms ease-out' }}
          />
        </svg>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2 space-y-6">
        {/* Panel 1 — Your details */}
        <section aria-labelledby="panel-details" className="rounded-card border border-oriel-line bg-oriel-white p-5 md:p-6">
          <h2 id="panel-details" className="t-h3">
            1 · Your details
          </h2>
          <div className="mt-4 space-y-4">
            <Field id="co-name" label="Full name" error={errors.customerName?.message}>
              <input id="co-name" autoComplete="name" className={inputClass} {...register('customerName')} />
            </Field>
            <Field id="co-phone" label="M-Pesa phone number" error={errors.phone?.message}>
              <div className="flex">
                <span className="flex h-11 items-center rounded-l-input border border-r-0 border-oriel-line bg-oriel-mist px-3 font-mono text-data text-oriel-navy-ink">
                  +254
                </span>
                <input
                  id="co-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="7XX XXX XXX"
                  aria-describedby="co-phone-help"
                  className={cn(inputClass, 'rounded-l-none font-mono')}
                  {...phoneReg}
                  ref={(el) => {
                    phoneFieldRef(el);
                    phoneRef.current = el;
                  }}
                />
              </div>
              <p id="co-phone-help" className="mt-1 text-caption text-oriel-slate">
                This is the number that will receive the payment request.
              </p>
            </Field>
            <Field id="co-email" label="Email" optional error={errors.email?.message}>
              <input id="co-email" type="email" autoComplete="email" placeholder="For your receipt and warranty" className={inputClass} {...register('email')} />
            </Field>
            <label className="flex items-center gap-2 text-small text-oriel-navy-ink">
              <input type="checkbox" className="h-4 w-4 accent-oriel-orange" {...register('isBusiness')} />
              I&apos;m buying for a business
            </label>
            {isBusiness && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="co-company" label="Company name" error={errors.companyName?.message}>
                  <input id="co-company" className={inputClass} {...register('companyName')} />
                </Field>
                <Field id="co-kra" label="KRA PIN" optional>
                  <input id="co-kra" className={cn(inputClass, 'font-mono uppercase')} {...register('kraPin')} />
                </Field>
              </div>
            )}
          </div>
        </section>

        {/* Panel 2 — Delivery */}
        <section aria-labelledby="panel-delivery" className="rounded-card border border-oriel-line bg-oriel-white p-5 md:p-6">
          <h2 id="panel-delivery" className="t-h3">
            2 · Delivery
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors',
                deliveryMethod === 'delivery'
                  ? 'border-oriel-orange bg-oriel-orange-soft'
                  : 'border-oriel-line hover:border-oriel-navy'
              )}
            >
              <span className="flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-oriel-navy">
                <input type="radio" value="delivery" className="accent-oriel-orange" {...register('deliveryMethod')} />
                <DeliveryIcon size={16} /> Deliver to my address
              </span>
              <span className="text-small text-oriel-slate">
                Nationwide. Delivery charge is paid on arrival.
              </span>
            </label>
            <label
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-card border p-4 transition-colors',
                deliveryMethod === 'collection'
                  ? 'border-oriel-orange bg-oriel-orange-soft'
                  : 'border-oriel-line hover:border-oriel-navy'
              )}
            >
              <span className="flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-oriel-navy">
                <input type="radio" value="collection" className="accent-oriel-orange" {...register('deliveryMethod')} />
                <Store size={18} strokeWidth={1.5} aria-hidden /> Collect it myself
              </span>
              <span className="text-small text-oriel-slate">
                Collect from us in Nairobi —{' '}
                <span className="font-semibold text-oriel-green-deep">free</span>. We confirm the
                point and time when your order is ready.
              </span>
            </label>
          </div>

          {deliveryMethod === 'delivery' && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="co-county" label="County" error={errors.county?.message}>
                  <select id="co-county" className={inputClass} {...register('county')}>
                    <option value="">Choose…</option>
                    {COUNTIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="co-town" label="Town, estate or landmark" error={errors.town?.message}>
                  <input id="co-town" className={inputClass} {...register('town')} />
                </Field>
              </div>
              <Field id="co-notes" label="Anything that helps us find you" optional>
                <input id="co-notes" placeholder="Gate, floor, nearby shop…" className={inputClass} {...register('deliveryNotes')} />
              </Field>
            </div>
          )}

          <label className="mt-4 flex items-start gap-3 rounded-card bg-oriel-green-soft p-4 text-small text-oriel-navy-ink">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-oriel-green-deep" {...register('withInstallation')} />
            <span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Wrench size={14} strokeWidth={1.5} aria-hidden /> Add professional installation to
                this order
              </span>
              Installation is quoted with your order, after a site survey, and confirmed in
              writing before any work is booked.
            </span>
          </label>
        </section>

        {/* Panel 3 — Payment: exactly two methods, both M-Pesa STK push */}
        <section aria-labelledby="panel-payment" className="rounded-card border border-oriel-line bg-oriel-white p-5 md:p-6">
          <h2 id="panel-payment" className="t-h3">
            3 · Payment
          </h2>
          <div className="mt-4 space-y-3">
            <label
              className={cn(
                'block cursor-pointer rounded-card border p-4 transition-colors',
                paymentOption === 'pay_now'
                  ? 'border-oriel-orange bg-oriel-orange-soft'
                  : 'border-oriel-line hover:border-oriel-navy'
              )}
            >
              <span className="flex flex-wrap items-center gap-2">
                <input type="radio" value="pay_now" className="accent-oriel-orange" {...register('paymentOption')} />
                <span className="font-display text-[1rem] font-semibold text-oriel-navy">
                  Pay now with
                </span>
                <MpesaMark height={17} />
                <span className="rounded-pill bg-oriel-green-soft px-2.5 py-0.5 text-micro font-semibold text-oriel-green-deep">
                  Instant
                </span>
              </span>
              <span className="mt-2 block text-small text-oriel-navy-ink">
                We send the request to your phone. Enter your PIN to approve.
              </span>
              <span className="mt-2 flex items-center gap-2 font-mono text-caption text-oriel-navy-ink">
                {msisdn ?? 'Enter your number above'}
                <button
                  type="button"
                  onClick={() => phoneRef.current?.focus()}
                  className="inline-flex min-h-[44px] items-center px-1 font-sans text-caption font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2"
                >
                  Change
                </button>
              </span>
            </label>

            <label
              className={cn(
                'block cursor-pointer rounded-card border p-4 transition-colors',
                paymentOption === 'pay_on_delivery'
                  ? 'border-oriel-orange bg-oriel-orange-soft'
                  : 'border-oriel-line hover:border-oriel-navy'
              )}
            >
              <span className="flex flex-wrap items-center gap-2">
                <input type="radio" value="pay_on_delivery" className="accent-oriel-orange" {...register('paymentOption')} />
                <DeliveryIcon size={16} />
                <span className="font-display text-[1rem] font-semibold text-oriel-navy">
                  Pay on delivery
                </span>
                <MpesaMark height={17} />
              </span>
              <span className="mt-2 block text-small text-oriel-navy-ink">
                We deliver first. You approve the M-Pesa request at handover — no cash.
              </span>
            </label>
          </div>

          <label className="mt-5 flex items-start gap-3 text-small text-oriel-navy-ink">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-oriel-orange" {...register('acceptTerms')} />
            <span>
              I accept the{' '}
              <Link href="/legal/terms" className="underline underline-offset-2 hover:text-oriel-orange" target="_blank">
                terms of sale
              </Link>{' '}
              and the{' '}
              <Link href="/legal/delivery-returns" className="underline underline-offset-2 hover:text-oriel-orange" target="_blank">
                delivery &amp; returns policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-caption text-oriel-navy-ink" aria-live="polite">
              {errors.acceptTerms.message}
            </p>
          )}

          {submitError && (
            <p className="mt-4 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink" aria-live="polite">
              {submitError}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting
              ? 'Placing your order…'
              : paymentOption === 'pay_now'
                ? `Place order & pay ${formatKes(subtotal)}`
                : 'Place order — pay on delivery'}
          </Button>
          <p className="mt-3 text-center text-caption text-oriel-slate">
            Your payment is processed securely by Safaricom M-Pesa. We never see your PIN.
          </p>
        </section>
      </form>
    </div>
  );
}
