import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Download, MessageCircle, Phone } from 'lucide-react';
import { getDocumentByNumber } from '@/lib/documents/store';
import { Button } from '@/components/ui/button';
import {
  DOCUMENT_STATUS_LABEL,
  formatAmount,
  formatDocumentDate,
  paymentMethodLabel,
} from '@/lib/documents/types';

/**
 * A customer's own invoice or receipt, reached by the tokenised link we send
 * them. Built for the person who was sent it on WhatsApp and opens it on a
 * phone: the figures are readable without pinching, and the PDF is one tap
 * away rather than embedded in a viewer that Android will not render anyway.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: { absolute: 'Your document · Oriel Power Ltd' },
};

export default async function PublicDocumentPage({
  params,
  searchParams,
}: {
  params: { docNumber: string };
  searchParams: { token?: string };
}) {
  const document = await getDocumentByNumber(params.docNumber);

  // Same answer for a bad number and a bad token, so the page cannot be used
  // to discover which document numbers exist.
  if (!document || !searchParams.token || searchParams.token !== document.accessToken) {
    notFound();
  }

  const isReceipt = document.docType === 'receipt';
  const pdfUrl = `/api/documents/${document.docNumber}/pdf?token=${document.accessToken}`;
  const owing = document.balance > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="overflow-hidden rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest">
        <div className="bg-oriel-navy px-6 py-5">
          <p className="text-eyebrow font-semibold uppercase tracking-[0.14em] text-oriel-gold">
            Oriel Power Ltd
          </p>
          <h1 className="mt-1 font-headline text-h2 font-semibold text-oriel-white">
            {isReceipt ? 'Payment receipt' : 'Sales invoice'}
          </h1>
          <p className="mt-1 font-mono text-small text-oriel-white/80">{document.docNumber}</p>
        </div>

        <div className="space-y-5 p-6">
          <dl className="space-y-2 text-small">
            <div className="flex justify-between gap-4">
              <dt className="text-oriel-slate">Issued to</dt>
              <dd className="text-right font-medium text-oriel-navy-ink">
                {document.customerName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-oriel-slate">Date</dt>
              <dd className="font-mono text-oriel-navy-ink">
                {formatDocumentDate(document.issuedAt ?? document.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-oriel-slate">Status</dt>
              <dd className="font-medium text-oriel-navy-ink">
                {DOCUMENT_STATUS_LABEL[document.status]}
              </dd>
            </div>
            {document.paymentMethod && (
              <div className="flex justify-between gap-4">
                <dt className="text-oriel-slate">Paid by</dt>
                <dd className="text-oriel-navy-ink">
                  {paymentMethodLabel(document.paymentMethod)}
                  {document.mpesaCode ? ` · ${document.mpesaCode}` : ''}
                  {document.bankRef ? ` · ${document.bankRef}` : ''}
                </dd>
              </div>
            )}
          </dl>

          <ul className="divide-y divide-oriel-line border-y border-oriel-line">
            {document.lines.map((line, i) => (
              <li key={`${line.description}-${i}`} className="flex justify-between gap-4 py-3">
                <span className="min-w-0 text-small text-oriel-navy-ink">
                  {line.description}
                  <span className="ml-2 font-mono text-micro text-oriel-slate">
                    × {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-small text-oriel-navy-ink">
                  {formatAmount(line.amount)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="space-y-1.5 text-small">
            <div className="flex justify-between gap-4">
              <dt className="text-oriel-slate">Subtotal</dt>
              <dd className="font-mono text-oriel-navy-ink">{formatAmount(document.subtotal)}</dd>
            </div>
            {document.vatMode !== 'none' && (
              <div className="flex justify-between gap-4">
                <dt className="text-oriel-slate">VAT @ {document.vatRate}%</dt>
                <dd className="font-mono text-oriel-navy-ink">{formatAmount(document.vatAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-oriel-line pt-2">
              <dt className="font-semibold text-oriel-navy">Total (KES)</dt>
              <dd className="font-mono text-data font-medium text-oriel-navy-ink">
                {formatAmount(document.total)}
              </dd>
            </div>
            {document.amountPaid > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-oriel-slate">Amount paid</dt>
                <dd className="font-mono text-oriel-green-deep">
                  {formatAmount(document.amountPaid)}
                </dd>
              </div>
            )}
            {owing && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold text-oriel-navy">Balance due</dt>
                <dd className="font-mono font-medium text-oriel-orange-deep">
                  {formatAmount(document.balance)}
                </dd>
              </div>
            )}
          </dl>

          <Button asChild className="min-h-touch w-full">
            <a href={pdfUrl}>
              <Download size={18} strokeWidth={1.5} aria-hidden />
              Download the PDF
            </a>
          </Button>

          <p className="text-center text-micro text-oriel-slate">
            All amounts in Kenyan Shillings. Goods remain the property of Oriel Power Ltd until
            paid in full.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-oriel-line bg-oriel-mist px-6 py-4">
          <a
            href="tel:+254723204342"
            className="inline-flex items-center gap-1.5 text-small font-semibold text-oriel-navy hover:text-oriel-orange"
          >
            <Phone size={15} strokeWidth={1.5} aria-hidden /> 0723 204 342
          </a>
          <a
            href="https://wa.me/254723204342"
            className="inline-flex items-center gap-1.5 text-small font-semibold text-oriel-green-deep hover:text-oriel-green"
          >
            <MessageCircle size={15} strokeWidth={1.5} aria-hidden /> WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
