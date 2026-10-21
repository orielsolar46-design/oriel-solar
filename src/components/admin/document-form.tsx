'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  GOODS_CATEGORIES,
  PAYMENT_METHODS,
  computeTotals,
  formatAmount,
  round2,
  type DocumentLine,
  type DocumentRecord,
  type DocumentType,
  type PaymentMethod,
  type VatMode,
} from '@/lib/documents/types';
import { cn } from '@/lib/utils';

/**
 * The invoice / receipt writer.
 *
 * This is the counter's till. Someone walks in, buys a heat pump and an AVS
 * switch, and this screen has to produce the same document they would have got
 * from the paper pad — in less time than writing it out by hand, or they will
 * go back to the pad.
 *
 * Two decisions follow from that:
 *
 *  - **The line total is editable.** It defaults to quantity × unit price, and
 *    the moment a clerk types over it, it stops being derived. That is not a
 *    loophole, it is the job: the client's own sample receipt lists a 300L heat
 *    pump at 199,940 and charges 180,940, because they negotiated. A form that
 *    could not express that would be a form nobody used.
 *
 *  - **The totals are live and computed by the same function the server uses.**
 *    `computeTotals` is imported from the shared model, not reimplemented here,
 *    so the figures on screen cannot disagree with the figures on the PDF.
 */

type LineDraft = DocumentLine & {
  /** Once the clerk types over the amount, we stop recomputing it for them. */
  amountEdited: boolean;
  key: number;
};

let nextKey = 1;

function blankLine(): LineDraft {
  return { description: '', quantity: 1, unitPrice: null, amount: 0, amountEdited: false, key: nextKey++ };
}

function toDraft(line: DocumentLine): LineDraft {
  return {
    ...line,
    amountEdited: round2(line.quantity * (line.unitPrice ?? 0)) !== round2(line.amount),
    key: nextKey++,
  };
}

/* -------------------------------------------------------------------------- */
/* Field primitives                                                            */
/* -------------------------------------------------------------------------- */

const FIELD =
  'h-12 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-small text-oriel-navy-ink transition-all placeholder:text-oriel-slate/70 focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20';

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-micro text-oriel-slate">{hint}</span>}
    </label>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest">
      <h2 className="font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
        {title}
      </h2>
      {hint && <p className="mt-0.5 text-micro text-oriel-slate">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * A money field.
 *
 * Held as a string while it has focus so a half-typed "1200." does not get
 * normalised out from under the clerk's cursor — which is what happens if the
 * value is parsed to a number on every keystroke.
 */
function Money({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      className={cn(FIELD, 'text-right font-mono', className)}
      placeholder={placeholder ?? '0.00'}
      value={draft ?? (value == null ? '' : String(value))}
      onFocus={(e) => setDraft(e.target.value)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.]/g, '');
        setDraft(raw);
        onChange(raw === '' ? null : Number.parseFloat(raw) || 0);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* The form                                                                    */
/* -------------------------------------------------------------------------- */

export function DocumentForm({ existing }: { existing?: DocumentRecord }) {
  const router = useRouter();

  const [docType, setDocType] = useState<DocumentType>(existing?.docType ?? 'receipt');
  const [customerName, setCustomerName] = useState(existing?.customerName ?? '');
  const [customerPhone, setCustomerPhone] = useState(existing?.customerPhone ?? '');
  const [customerEmail, setCustomerEmail] = useState(existing?.customerEmail ?? '');
  const [customerAddress, setCustomerAddress] = useState(existing?.customerAddress ?? '');
  const [kraPin, setKraPin] = useState(existing?.kraPin ?? '');

  const [goods, setGoods] = useState<string[]>(existing?.goodsCategories ?? []);
  const [lines, setLines] = useState<LineDraft[]>(
    existing?.lines.length ? existing.lines.map(toDraft) : [blankLine()]
  );

  const [vatMode, setVatMode] = useState<VatMode>(existing?.vatMode ?? 'exclusive');
  const [vatRate, setVatRate] = useState<number>(existing?.vatRate ?? 16);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    existing?.paymentMethod ?? null
  );
  const [mpesaTill, setMpesaTill] = useState(existing?.mpesaTill ?? '');
  const [mpesaCode, setMpesaCode] = useState(existing?.mpesaCode ?? '');
  const [bankRef, setBankRef] = useState(existing?.bankRef ?? '');
  const [amountPaid, setAmountPaid] = useState<number | null>(existing?.amountPaid ?? null);
  const [receivedBy, setReceivedBy] = useState(existing?.receivedBy ?? '');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const [busy, setBusy] = useState<null | 'draft' | 'issue' | 'send'>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => computeTotals(lines, vatMode, vatRate, amountPaid ?? 0),
    [lines, vatMode, vatRate, amountPaid]
  );

  /** Keep the derived amount in step unless the clerk has taken it over. */
  const patchLine = (key: number, patch: Partial<LineDraft>) => {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (!next.amountEdited && !('amount' in patch)) {
          next.amount = round2(next.quantity * (next.unitPrice ?? 0));
        }
        return next;
      })
    );
  };

  const payload = () => ({
    docType,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    customerEmail: customerEmail.trim(),
    customerAddress: customerAddress.trim(),
    kraPin: kraPin.trim(),
    goodsCategories: goods,
    lines: lines
      .filter((line) => line.description.trim())
      .map((line) => ({
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        amount: line.amount,
      })),
    vatMode,
    vatRate,
    amountPaid: amountPaid ?? 0,
    paymentMethod,
    mpesaTill: mpesaTill.trim(),
    mpesaCode: mpesaCode.trim(),
    bankRef: bankRef.trim(),
    receivedBy: receivedBy.trim(),
    notes: notes.trim(),
    dueDate: dueDate || '',
  });

  const submit = async (mode: 'draft' | 'issue') => {
    setError(null);

    if (!customerName.trim()) {
      setError('Who is this for? Put a name in.');
      return;
    }
    if (!lines.some((line) => line.description.trim())) {
      setError('Add at least one line describing what was supplied.');
      return;
    }

    setBusy(mode);
    try {
      const issue = mode === 'issue' ? '?issue=1' : '';
      const response = await fetch(
        existing ? `/api/admin/documents/${existing.id}${issue}` : `/api/admin/documents${issue}`,
        {
          method: existing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.error ?? 'Could not save that. Try again.');
        setBusy(null);
        return;
      }
      router.push(`/admin/invoices/${data.document.id}`);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check the connection and try again.');
      setBusy(null);
    }
  };

  const isReceipt = docType === 'receipt';

  return (
    <div className="space-y-5 pb-28">
      {/* What kind of document. Changing this changes the wording on the PDF
          and nothing else — same layout, same numbering series shape. */}
      <Section title="What are you writing?">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['receipt', 'Receipt', 'Money has been taken'],
              ['invoice', 'Invoice', 'Money is being asked for'],
            ] as const
          ).map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDocType(id)}
              aria-pressed={docType === id}
              className={cn(
                'rounded-input border p-3 text-left transition-all',
                docType === id
                  ? 'border-oriel-navy bg-oriel-navy text-oriel-white'
                  : 'border-oriel-line bg-oriel-white text-oriel-navy-ink hover:border-oriel-navy'
              )}
            >
              <span className="block text-small font-semibold">{label}</span>
              <span
                className={cn(
                  'mt-0.5 block text-micro',
                  docType === id ? 'text-oriel-white/75' : 'text-oriel-slate'
                )}
              >
                {hint}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Who is it for?"
        hint="Only the name is required — a counter sale often has nothing else."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name or company" className="sm:col-span-2">
            <input
              className={FIELD}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Labeila Hotel"
              autoComplete="off"
            />
          </Field>
          <Field label="Phone" hint="Needed to send it over WhatsApp.">
            <input
              className={FIELD}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="0722 000 000"
              inputMode="tel"
              autoComplete="off"
            />
          </Field>
          <Field label="Email" hint="Leave blank if they have not got one.">
            <input
              className={FIELD}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="name@example.com"
              inputMode="email"
              autoComplete="off"
            />
          </Field>
          <Field label="Address">
            <input
              className={FIELD}
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Kilimani, Nairobi"
              autoComplete="off"
            />
          </Field>
          <Field label="KRA PIN" hint="Business customers only.">
            <input
              className={cn(FIELD, 'font-mono uppercase')}
              value={kraPin}
              onChange={(e) => setKraPin(e.target.value)}
              placeholder="P051234567X"
              autoComplete="off"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Goods / service"
        hint="The tick boxes across the top of the document. Tick what this sale is."
      >
        <div className="flex flex-wrap gap-2">
          {GOODS_CATEGORIES.map((category) => {
            const on = goods.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setGoods((current) =>
                    on ? current.filter((id) => id !== category.id) : [...current, category.id]
                  )
                }
                aria-pressed={on}
                className={cn(
                  'inline-flex h-10 items-center rounded-pill border px-4 text-small font-medium transition-colors',
                  on
                    ? 'border-oriel-navy bg-oriel-navy text-oriel-white'
                    : 'border-oriel-line bg-oriel-white text-oriel-navy-ink hover:border-oriel-navy'
                )}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="What was supplied"
        hint="The line total works itself out. Type over it if you agreed a different price."
      >
        <div className="space-y-3">
          {lines.map((line, index) => (
            <div
              key={line.key}
              className="rounded-input border border-oriel-line bg-oriel-mist/40 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-3 w-5 shrink-0 text-center font-mono text-micro text-oriel-slate">
                  {index + 1}
                </span>
                <input
                  className={cn(FIELD, 'flex-1')}
                  value={line.description}
                  onChange={(e) => patchLine(line.key, { description: e.target.value })}
                  placeholder="CE Solar Heat Pump 300L"
                  aria-label={`Line ${index + 1} description`}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() =>
                    setLines((current) =>
                      current.length === 1
                        ? [blankLine()]
                        : current.filter((l) => l.key !== line.key)
                    )
                  }
                  className="mt-0.5 flex h-12 w-11 shrink-0 items-center justify-center rounded-input text-oriel-slate transition-colors hover:bg-oriel-orange-soft hover:text-oriel-orange-deep"
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 size={17} strokeWidth={1.5} />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2 pl-7">
                <Field label="Qty">
                  <input
                    type="number"
                    min={1}
                    className={cn(FIELD, 'text-right font-mono')}
                    value={line.quantity}
                    onChange={(e) =>
                      patchLine(line.key, {
                        quantity: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                      })
                    }
                    aria-label={`Line ${index + 1} quantity`}
                  />
                </Field>
                <Field label="Unit price">
                  <Money
                    value={line.unitPrice}
                    onChange={(value) => patchLine(line.key, { unitPrice: value })}
                    placeholder="—"
                    ariaLabel={`Line ${index + 1} unit price`}
                  />
                </Field>
                <Field label="Amount">
                  <Money
                    value={line.amount}
                    onChange={(value) =>
                      patchLine(line.key, { amount: value ?? 0, amountEdited: true })
                    }
                    ariaLabel={`Line ${index + 1} amount`}
                    className={line.amountEdited ? 'border-oriel-gold bg-oriel-gold-soft' : ''}
                  />
                </Field>
              </div>

              {line.amountEdited && (
                <p className="mt-1.5 pl-7 text-micro text-oriel-navy-ink">
                  Set by hand.{' '}
                  <button
                    type="button"
                    className="font-semibold text-oriel-orange-deep underline"
                    onClick={() =>
                      patchLine(line.key, {
                        amountEdited: false,
                        amount: round2(line.quantity * (line.unitPrice ?? 0)),
                      })
                    }
                  >
                    Work it out again
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLines((current) => [...current, blankLine()])}
          className="mt-3 inline-flex h-11 items-center gap-2 rounded-pill border border-oriel-line px-4 text-small font-semibold text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
        >
          <Plus size={16} strokeWidth={1.5} /> Add a line
        </button>
      </Section>

      <Section title="VAT" hint="How the prices you typed above should be read.">
        <div className="space-y-2">
          {(
            [
              ['exclusive', 'Add VAT on top', 'The prices above are before VAT. This is how the paper pad works.'],
              [
                'inclusive',
                'Prices already include VAT',
                'Use this when you have quoted a shop price — the VAT is worked back out of it.',
              ],
              ['none', 'No VAT', 'Nothing is added and no VAT line is printed.'],
            ] as const
          ).map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVatMode(id)}
              aria-pressed={vatMode === id}
              className={cn(
                'flex w-full items-start gap-3 rounded-input border p-3 text-left transition-colors',
                vatMode === id
                  ? 'border-oriel-navy bg-oriel-mist'
                  : 'border-oriel-line bg-oriel-white hover:border-oriel-navy'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-2',
                  vatMode === id ? 'border-oriel-navy' : 'border-oriel-line'
                )}
                aria-hidden
              >
                {vatMode === id && <span className="h-2.5 w-2.5 rounded-pill bg-oriel-navy" />}
              </span>
              <span>
                <span className="block text-small font-semibold text-oriel-navy-ink">{label}</span>
                <span className="mt-0.5 block text-micro text-oriel-slate">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        {vatMode !== 'none' && (
          <Field label="VAT rate (%)" className="mt-4 max-w-[9rem]">
            <input
              type="number"
              min={0}
              max={100}
              step="0.5"
              className={cn(FIELD, 'text-right font-mono')}
              value={vatRate}
              onChange={(e) => setVatRate(Number.parseFloat(e.target.value) || 0)}
            />
          </Field>
        )}
      </Section>

      <Section title="Payment">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() =>
                setPaymentMethod((current) => (current === method.id ? null : method.id))
              }
              aria-pressed={paymentMethod === method.id}
              className={cn(
                'h-11 rounded-input border text-small font-medium transition-colors',
                paymentMethod === method.id
                  ? 'border-oriel-navy bg-oriel-navy text-oriel-white'
                  : 'border-oriel-line bg-oriel-white text-oriel-navy-ink hover:border-oriel-navy'
              )}
            >
              {method.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {paymentMethod === 'mpesa' && (
            <>
              <Field label="M-Pesa till / paybill">
                <input
                  className={cn(FIELD, 'font-mono')}
                  value={mpesaTill}
                  onChange={(e) => setMpesaTill(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </Field>
              <Field label="M-Pesa transaction code">
                <input
                  className={cn(FIELD, 'font-mono uppercase')}
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  placeholder="TGH4KL91XZ"
                  autoComplete="off"
                />
              </Field>
            </>
          )}
          {(paymentMethod === 'bank_transfer' || paymentMethod === 'cheque') && (
            <Field label="Bank / cheque reference" className="sm:col-span-2">
              <input
                className={cn(FIELD, 'font-mono')}
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="EQ/2026/44817"
                autoComplete="off"
              />
            </Field>
          )}

          <Field
            label="Amount paid"
            hint={
              isReceipt
                ? 'What actually came in. Leave the total to settle it in full.'
                : 'Any deposit already taken. Leave blank if nothing has been paid.'
            }
          >
            <Money value={amountPaid} onChange={setAmountPaid} />
          </Field>

          <Field label="Received by" hint="Whose name goes on the signature line.">
            <input
              className={FIELD}
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              autoComplete="off"
            />
          </Field>

          {!isReceipt && (
            <Field label="Payment due by">
              <input
                type="date"
                className={FIELD}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          )}
        </div>

        {totals.total > 0 && (amountPaid ?? 0) === 0 && isReceipt && (
          <p className="mt-4 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
            Nothing is recorded as paid, so this receipt will print a balance of{' '}
            {formatAmount(totals.total)}. Put the amount in if the money has been taken.
          </p>
        )}

        <button
          type="button"
          onClick={() => setAmountPaid(totals.total)}
          className="mt-3 text-small font-semibold text-oriel-orange-deep underline"
        >
          Paid in full — {formatAmount(totals.total)}
        </button>
      </Section>

      <Section title="Note" hint="Printed nowhere on the document; kept in the back office.">
        <textarea
          className={cn(FIELD, 'h-24 resize-y py-3')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivered by Peter, customer collecting the second unit next week."
        />
      </Section>

      {/* The summary box, laid out exactly as it prints. Reading it here and
          reading it on the PDF must be the same experience. */}
      <section className="rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest">
        <h2 className="border-b border-oriel-line p-5 pb-4 font-headline text-[1.0625rem] font-semibold text-oriel-navy">
          Summary
        </h2>
        <dl className="p-5 pt-4">
          {[
            { label: 'Subtotal', value: totals.subtotal },
            ...(vatMode === 'none'
              ? []
              : [{ label: `VAT @ ${vatRate}%`, value: totals.vatAmount }]),
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-4 py-1.5">
              <dt className="text-small text-oriel-slate">{row.label}</dt>
              <dd className="font-mono text-small text-oriel-navy-ink">{formatAmount(row.value)}</dd>
            </div>
          ))}
          <div className="mt-2 flex justify-between gap-4 rounded-input bg-oriel-navy px-3 py-2.5">
            <dt className="text-small font-semibold text-oriel-white">Total due (KES)</dt>
            <dd className="font-mono text-data font-medium text-oriel-white">
              {formatAmount(totals.total)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5 pt-3">
            <dt className="text-small text-oriel-slate">Amount paid</dt>
            <dd className="font-mono text-small text-oriel-green-deep">
              {formatAmount(amountPaid ?? 0)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1.5">
            <dt className="text-small font-semibold text-oriel-navy">Balance</dt>
            <dd
              className={cn(
                'font-mono text-small font-medium',
                totals.balance > 0 ? 'text-oriel-orange-deep' : 'text-oriel-navy-ink'
              )}
            >
              {formatAmount(totals.balance)}
            </dd>
          </div>
        </dl>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-input border border-oriel-orange bg-oriel-orange-soft p-3 text-small text-oriel-orange-deep"
        >
          {error}
        </p>
      )}

      {/* Pinned to the thumb. The admin's own mobile bar is hidden on this
          route so these are the only buttons down there. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-oriel-line bg-oriel-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-6xl gap-2 lg:px-10">
          <button
            type="button"
            onClick={() => submit('draft')}
            disabled={busy !== null}
            className="flex h-12 flex-1 items-center justify-center rounded-input border border-oriel-line bg-oriel-white px-4 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist disabled:opacity-60"
          >
            {busy === 'draft' ? (
              <Loader2 size={17} className="animate-spin" aria-hidden />
            ) : (
              'Save as draft'
            )}
          </button>
          <button
            type="button"
            onClick={() => submit('issue')}
            disabled={busy !== null}
            className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-input bg-oriel-orange px-4 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-60"
          >
            {busy === 'issue' ? (
              <Loader2 size={17} className="animate-spin" aria-hidden />
            ) : (
              <>Issue this {isReceipt ? 'receipt' : 'invoice'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
