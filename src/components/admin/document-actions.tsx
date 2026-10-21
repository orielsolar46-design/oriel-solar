'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
  Wallet,
} from 'lucide-react';
import { normaliseMsisdn } from '@/lib/checkout-schema';
import {
  PAYMENT_METHODS,
  formatAmount,
  type DocumentRecord,
  type PaymentMethod,
} from '@/lib/documents/types';
import { cn } from '@/lib/utils';

/**
 * What you can do with a document once it exists: get it to the customer,
 * take money against it, or cancel it.
 *
 * The three ways out are offered side by side and none is buried, because
 * which one is right depends entirely on the customer standing in front of
 * you. Roughly half of this shop's buyers have no email address at all — for
 * them WhatsApp is not a fallback, it is the delivery mechanism, and treating
 * it as second-class would make the feature useless for half the trade.
 */

const FIELD =
  'h-12 w-full rounded-input border border-oriel-line bg-oriel-white px-3 text-small text-oriel-navy-ink transition-all placeholder:text-oriel-slate/70 focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20';

function Panel({
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

export function DocumentActions({
  document: doc,
  publicUrl,
}: {
  document: DocumentRecord;
  publicUrl: string;
}) {
  const router = useRouter();

  const [to, setTo] = useState(doc.customerEmail ?? '');
  const [note, setNote] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'busy' | 'sent'>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  const [payAmount, setPayAmount] = useState<string>(
    doc.balance > 0 ? String(doc.balance) : ''
  );
  const [payMethod, setPayMethod] = useState<PaymentMethod | null>(doc.paymentMethod);
  const [payRef, setPayRef] = useState('');
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [voidReason, setVoidReason] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidBusy, setVoidBusy] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  const isVoid = doc.status === 'void';
  const kind = doc.docType === 'receipt' ? 'receipt' : 'invoice';
  const pdfBase = `/api/admin/documents/${doc.id}/pdf`;

  /**
   * The WhatsApp hand-off.
   *
   * `wa.me` cannot carry an attachment — no messaging deep link can — so the
   * message carries the tokenised link instead and the customer taps through
   * to the PDF. For a customer who wants the file itself, the download buttons
   * above put it in the phone's file picker, which is two taps in WhatsApp.
   */
  const whatsappHref = (() => {
    const msisdn = doc.customerPhone ? normaliseMsisdn(doc.customerPhone) : null;
    const message = [
      `Hello ${doc.customerName},`,
      '',
      doc.docType === 'receipt'
        ? `Here is your receipt ${doc.docNumber} from Oriel Power Ltd for KES ${formatAmount(doc.amountPaid)}.`
        : `Here is your invoice ${doc.docNumber} from Oriel Power Ltd for KES ${formatAmount(doc.total)}.`,
      doc.balance > 0 ? `Balance outstanding: KES ${formatAmount(doc.balance)}.` : '',
      '',
      publicUrl,
      '',
      'Asante sana - Oriel Power Ltd, 0723 204 342',
    ]
      .filter((line) => line !== '' || true)
      .join('\n');
    // Without a number the link still opens WhatsApp with the message ready to
    // paste into whichever chat the clerk picks.
    return `https://wa.me/${msisdn ?? ''}?text=${encodeURIComponent(message)}`;
  })();

  const send = async () => {
    setSendError(null);
    setSendState('busy');
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), note: note.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setSendError(data.error ?? 'The email could not be sent.');
        setSendState('idle');
        return;
      }
      setSendState('sent');
      router.refresh();
    } catch {
      setSendError('Could not reach the server. Check the connection.');
      setSendState('idle');
    }
  };

  const takePayment = async () => {
    setPayError(null);
    const amount = Number.parseFloat(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError('How much came in?');
      return;
    }
    setPayBusy(true);
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: payMethod,
          mpesaCode: payMethod === 'mpesa' ? payRef : '',
          bankRef: payMethod === 'bank_transfer' || payMethod === 'cheque' ? payRef : '',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setPayError(data.error ?? 'Could not record that.');
        setPayBusy(false);
        return;
      }
      setPayBusy(false);
      router.refresh();
    } catch {
      setPayError('Could not reach the server.');
      setPayBusy(false);
    }
  };

  const voidIt = async () => {
    setVoidError(null);
    if (voidReason.trim().length < 4) {
      setVoidError('Say why — this is a permanent record.');
      return;
    }
    setVoidBusy(true);
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void', reason: voidReason.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setVoidError(data.error ?? 'Could not void it.');
        setVoidBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setVoidError('Could not reach the server.');
      setVoidBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Print or download"
        hint="Two copies to a sheet is the one that matches the pad."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          <a
            href={`${pdfBase}?copy=both`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-input bg-oriel-navy px-3 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-navy-deep"
          >
            <Printer size={17} strokeWidth={1.5} aria-hidden /> Both copies
          </a>
          <a
            href={`${pdfBase}?copy=original&download=1`}
            className="flex h-12 items-center justify-center gap-2 rounded-input border border-oriel-line bg-oriel-white px-3 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
          >
            <Download size={17} strokeWidth={1.5} aria-hidden /> Original
          </a>
          <a
            href={`${pdfBase}?copy=duplicate&download=1`}
            className="flex h-12 items-center justify-center gap-2 rounded-input border border-oriel-line bg-oriel-white px-3 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
          >
            <Download size={17} strokeWidth={1.5} aria-hidden /> Duplicate
          </a>
        </div>
        <p className="mt-3 text-micro text-oriel-slate">
          The original is the customer&apos;s copy. The duplicate stays with the shop.
        </p>
      </Panel>

      {!isVoid && (
        <Panel
          title="Send it to the customer"
          hint={
            doc.lastSentAt
              ? `Last sent to ${doc.lastSentTo} on ${new Date(doc.lastSentAt).toLocaleString('en-KE')}.`
              : 'Not sent yet.'
          }
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                Email address
              </span>
              <input
                className={FIELD}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setSendState('idle');
                }}
                placeholder="name@example.com"
                inputMode="email"
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                Add a line to the email (optional)
              </span>
              <textarea
                className={cn(FIELD, 'h-20 resize-y py-3')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thank you for your business. The second unit is ready for collection on Friday."
              />
            </label>

            <button
              type="button"
              onClick={send}
              disabled={sendState === 'busy' || !to.trim()}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-input px-4 text-small font-semibold transition-colors disabled:opacity-60',
                sendState === 'sent'
                  ? 'bg-oriel-green-soft text-oriel-green-deep'
                  : 'bg-oriel-orange text-oriel-white hover:bg-oriel-orange-deep'
              )}
            >
              {sendState === 'busy' && <Loader2 size={17} className="animate-spin" aria-hidden />}
              {sendState === 'sent' && <Check size={17} strokeWidth={2} aria-hidden />}
              {sendState === 'idle' && <Mail size={17} strokeWidth={1.5} aria-hidden />}
              {sendState === 'sent' ? 'Sent' : `Email the ${kind} with the PDF`}
            </button>

            {sendError && (
              <p
                role="alert"
                className="rounded-input border border-oriel-orange bg-oriel-orange-soft p-3 text-small text-oriel-orange-deep"
              >
                {sendError}
              </p>
            )}

            <div className="border-t border-oriel-line pt-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-input bg-oriel-green px-4 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-green-deep"
              >
                <MessageCircle size={17} strokeWidth={1.5} aria-hidden /> Send it on WhatsApp
              </a>
              <p className="mt-2 text-micro text-oriel-slate">
                Opens WhatsApp with the message and a link to the {kind} ready to send. For
                customers with no email address. To attach the PDF itself instead, download the
                original above and add it in WhatsApp.
              </p>
            </div>
          </div>
        </Panel>
      )}

      {!isVoid && doc.balance > 0 && doc.status !== 'draft' && (
        <Panel
          title="Take a payment"
          hint={`${formatAmount(doc.balance)} outstanding.`}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPayMethod(method.id)}
                  aria-pressed={payMethod === method.id}
                  className={cn(
                    'h-11 rounded-input border text-small font-medium transition-colors',
                    payMethod === method.id
                      ? 'border-oriel-navy bg-oriel-navy text-oriel-white'
                      : 'border-oriel-line bg-oriel-white text-oriel-navy-ink hover:border-oriel-navy'
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                  Amount received
                </span>
                <input
                  className={cn(FIELD, 'text-right font-mono')}
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value.replace(/[^\d.]/g, ''))}
                />
              </label>
              {payMethod && payMethod !== 'cash' && (
                <label className="block">
                  <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                    {payMethod === 'mpesa' ? 'M-Pesa code' : 'Bank / cheque reference'}
                  </span>
                  <input
                    className={cn(FIELD, 'font-mono uppercase')}
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    autoComplete="off"
                  />
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={takePayment}
              disabled={payBusy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-input bg-oriel-green px-4 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-green-deep disabled:opacity-60"
            >
              {payBusy ? (
                <Loader2 size={17} className="animate-spin" aria-hidden />
              ) : (
                <Wallet size={17} strokeWidth={1.5} aria-hidden />
              )}
              Record this payment
            </button>

            {payError && (
              <p
                role="alert"
                className="rounded-input border border-oriel-orange bg-oriel-orange-soft p-3 text-small text-oriel-orange-deep"
              >
                {payError}
              </p>
            )}
          </div>
        </Panel>
      )}

      {!isVoid && (
        <Panel
          title="Cancel this document"
          hint="The number stays used and the record is kept — a numbered series with an unexplained hole in it is what causes trouble later."
        >
          {!voidOpen ? (
            <button
              type="button"
              onClick={() => setVoidOpen(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-input border border-oriel-orange bg-oriel-white px-4 text-small font-semibold text-oriel-orange-deep transition-colors hover:bg-oriel-orange-soft"
            >
              <AlertTriangle size={17} strokeWidth={1.5} aria-hidden /> Void this {kind}
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-eyebrow font-semibold uppercase tracking-[0.1em] text-oriel-slate">
                  Why is it being voided?
                </span>
                <input
                  className={FIELD}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Wrong customer — reissued as ORL-RCP-2608-0042"
                  autoComplete="off"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVoidOpen(false)}
                  className="h-12 flex-1 rounded-input border border-oriel-line bg-oriel-white text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={voidIt}
                  disabled={voidBusy}
                  className="flex h-12 flex-1 items-center justify-center rounded-input bg-oriel-orange text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-60"
                >
                  {voidBusy ? (
                    <Loader2 size={17} className="animate-spin" aria-hidden />
                  ) : (
                    'Void it'
                  )}
                </button>
              </div>
              {voidError && (
                <p role="alert" className="text-small text-oriel-orange-deep">
                  {voidError}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
