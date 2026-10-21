import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, ExternalLink, PencilLine } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getDocument } from '@/lib/documents/store';
import {
  DOCUMENT_STATUS_LABEL,
  formatAmount,
  formatDocumentDate,
  paymentMethodLabel,
  type DocumentStatus,
} from '@/lib/documents/types';
import { absoluteUrl } from '@/lib/site';
import { DocumentActions } from '@/components/admin/document-actions';
import { Pill } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Document' };

const STATUS_TONE: Record<DocumentStatus, 'plain' | 'green' | 'gold' | 'orange' | 'navy'> = {
  draft: 'plain',
  issued: 'navy',
  part_paid: 'gold',
  paid: 'green',
  void: 'orange',
};

export default async function AdminDocumentPage({ params }: { params: { id: string } }) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const doc = await getDocument(params.id);
  if (!doc) notFound();

  const isReceipt = doc.docType === 'receipt';
  const publicUrl = doc.docNumber
    ? absoluteUrl(`/document/${doc.docNumber}?token=${doc.accessToken}`)
    : '';

  return (
    <div className="space-y-5">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate hover:text-oriel-navy"
      >
        <ChevronLeft size={16} strokeWidth={1.5} /> Invoices &amp; receipts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-h2 font-medium text-oriel-navy">
              {doc.docNumber ?? 'Draft'}
            </h1>
            <Pill tone={STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABEL[doc.status]}</Pill>
          </div>
          <p className="mt-1 text-small text-oriel-slate">
            {isReceipt ? 'Payment receipt' : 'Sales invoice'} ·{' '}
            {doc.source === 'order' ? 'from a web order' : 'written at the counter'} ·{' '}
            {formatDocumentDate(doc.issuedAt ?? doc.createdAt)}
          </p>
        </div>

        {doc.status !== 'void' && (
          <Link
            href={`/admin/invoices/${doc.id}/edit`}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-pill border border-oriel-line px-4 text-small font-semibold text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
          >
            <PencilLine size={16} strokeWidth={1.5} aria-hidden /> Edit
          </Link>
        )}
      </div>

      {doc.status === 'draft' && (
        <p className="rounded-card bg-oriel-gold-soft p-4 text-small text-oriel-navy-ink">
          This is a draft. It has no number yet and nothing has gone to the customer. Edit it and
          press <strong>Issue</strong> when it is right.
        </p>
      )}

      {doc.orderNumber && (
        <Link
          href={`/admin/orders/${doc.orderNumber}`}
          className="flex items-center justify-between gap-3 rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest transition-colors hover:border-oriel-navy"
        >
          <span>
            <span className="block text-small font-semibold text-oriel-navy">
              Raised from order {doc.orderNumber}
            </span>
            <span className="mt-0.5 block text-micro text-oriel-slate">
              Open the order to see its delivery and payment history
            </span>
          </span>
          <ExternalLink size={17} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
        </Link>
      )}

      <section className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest">
        <h2 className="t-h3">Customer</h2>
        <dl className="mt-3 space-y-1.5 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Name</dt>
            <dd className="text-right text-oriel-navy-ink">{doc.customerName}</dd>
          </div>
          {doc.customerPhone && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Phone</dt>
              <dd>
                <a href={`tel:${doc.customerPhone}`} className="font-mono text-oriel-navy underline">
                  {doc.customerPhone}
                </a>
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Email</dt>
            <dd className="truncate text-right text-oriel-navy-ink">
              {doc.customerEmail ?? <span className="text-oriel-slate">None on file</span>}
            </dd>
          </div>
          {doc.customerAddress && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Address</dt>
              <dd className="text-right text-oriel-navy-ink">{doc.customerAddress}</dd>
            </div>
          )}
          {doc.kraPin && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">KRA PIN</dt>
              <dd className="font-mono text-oriel-navy-ink">{doc.kraPin}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest">
        <h2 className="t-h3">What it covers</h2>
        <ul className="mt-3 divide-y divide-oriel-line">
          {doc.lines.map((line, i) => (
            <li key={`${line.description}-${i}`} className="flex items-start justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-small text-oriel-navy-ink">{line.description}</span>
                <span className="block font-mono text-[0.6875rem] text-oriel-slate">
                  {line.quantity} × {line.unitPrice == null ? '—' : formatAmount(line.unitPrice)}
                </span>
              </span>
              <span className="shrink-0 font-mono text-small text-oriel-navy-ink">
                {formatAmount(line.amount)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1.5 border-t border-oriel-line pt-3 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Subtotal</dt>
            <dd className="font-mono text-oriel-navy-ink">{formatAmount(doc.subtotal)}</dd>
          </div>
          {doc.vatMode !== 'none' && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">
                VAT @ {doc.vatRate}%{' '}
                <span className="text-micro">
                  ({doc.vatMode === 'inclusive' ? 'included in the prices' : 'added on top'})
                </span>
              </dt>
              <dd className="font-mono text-oriel-navy-ink">{formatAmount(doc.vatAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-oriel-line pt-2">
            <dt className="font-semibold text-oriel-navy">Total (KES)</dt>
            <dd className="font-mono text-data font-medium text-oriel-navy-ink">
              {formatAmount(doc.total)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Amount paid</dt>
            <dd className="font-mono text-oriel-green-deep">{formatAmount(doc.amountPaid)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-oriel-navy">Balance</dt>
            <dd
              className={`font-mono font-medium ${
                doc.balance > 0 ? 'text-oriel-orange-deep' : 'text-oriel-navy-ink'
              }`}
            >
              {formatAmount(doc.balance)}
            </dd>
          </div>
        </dl>

        {doc.paymentMethod && (
          <p className="mt-4 rounded-input bg-oriel-mist p-3 text-small text-oriel-navy-ink">
            Paid by <strong>{paymentMethodLabel(doc.paymentMethod)}</strong>
            {doc.mpesaCode ? ` · code ${doc.mpesaCode}` : ''}
            {doc.mpesaTill ? ` · till ${doc.mpesaTill}` : ''}
            {doc.bankRef ? ` · ref ${doc.bankRef}` : ''}
            {doc.receivedBy ? ` · received by ${doc.receivedBy}` : ''}
          </p>
        )}

        {doc.notes && (
          <p className="mt-3 whitespace-pre-line rounded-input bg-oriel-mist p-3 text-small text-oriel-navy-ink">
            {doc.notes}
          </p>
        )}
      </section>

      {doc.docNumber ? (
        <DocumentActions document={doc} publicUrl={publicUrl} />
      ) : (
        <p className="rounded-card border border-dashed border-oriel-line bg-oriel-mist/60 p-5 text-center text-small text-oriel-slate">
          Issue this document to get a number, a PDF and the ways to send it.
        </p>
      )}
    </div>
  );
}
