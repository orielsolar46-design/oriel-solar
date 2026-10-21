import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, ExternalLink, Send } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { documentsForOrder } from '@/lib/documents/store';
import { DOCUMENT_STATUS_LABEL } from '@/lib/documents/types';
import { getOrder } from '@/lib/orders/store';
import { formatKes } from '@/lib/shop';
import { CodPayment } from '@/components/admin/cod-payment';
import { StatusControls } from '@/components/admin/status-controls';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  payment_failed: 'Payment failed',
  pending_cod: 'Pay on delivery',
  processing: 'Processing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default async function AdminOrderDetail({
  params,
}: {
  params: { orderNumber: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const order = await getOrder(params.orderNumber);
  if (!order) notFound();

  const documents = await documentsForOrder(order.id);
  const paidPayment = order.payments.find((p) => p.status === 'paid');
  const isCod = order.paymentOption === 'pay_on_delivery';

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate hover:text-oriel-navy"
      >
        <ChevronLeft size={16} strokeWidth={1.5} /> All orders
      </Link>

      <div>
        <h1 className="font-mono text-h2 font-medium text-oriel-navy">{order.orderNumber}</h1>
        <p className="mt-1 text-small text-oriel-slate">
          {STATUS_LABEL[order.status] ?? order.status} ·{' '}
          {isCod ? 'Pay on delivery (M-Pesa)' : 'Pay now (M-Pesa)'} ·{' '}
          {new Date(order.createdAt).toLocaleString('en-KE')}
        </p>
      </div>

      {/* The gate-side payment action leads on COD orders */}
      {isCod && order.status !== 'cancelled' && (
        <CodPayment
          orderNumber={order.orderNumber}
          total={order.total}
          phone={order.phone}
          alreadyPaid={Boolean(paidPayment)}
          paidReceipt={paidPayment?.mpesaReceipt ?? null}
          canDeliver={order.status === 'out_for_delivery' && Boolean(paidPayment)}
        />
      )}

      {/* Sending the request ahead of the handover — the same push, from a desk
          rather than the gate. Offered only while there is something to pay. */}
      {isCod && !paidPayment && order.status !== 'cancelled' && (
        <Link
          href={`/admin/orders/${order.orderNumber}/prompt`}
          className="flex items-center justify-between gap-3 rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest transition-all duration-200 ease-oriel-out hover:-translate-y-0.5 hover:border-oriel-orange hover:shadow-oriel-lift"
        >
          <span className="min-w-0">
            <span className="block font-headline text-small font-semibold text-oriel-navy">
              Send a payment prompt
            </span>
            <span className="mt-0.5 block text-micro text-oriel-slate">
              Push the M-Pesa request without waiting for the handover
            </span>
          </span>
          <Send size={18} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
        </Link>
      )}

      {/* Customer */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
        <h2 className="t-h3">Customer</h2>
        <dl className="mt-3 space-y-1.5 text-small">
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Name</dt>
            <dd className="text-oriel-navy-ink">{order.customerName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">Phone</dt>
            <dd>
              <a href={`tel:+${order.phone}`} className="font-mono text-oriel-navy underline">
                {order.phone}
              </a>
            </dd>
          </div>
          {order.email && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Email</dt>
              <dd className="truncate text-oriel-navy-ink">{order.email}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-oriel-slate">
              {order.deliveryMethod === 'collection' ? 'Collection' : 'Deliver to'}
            </dt>
            <dd className="text-right text-oriel-navy-ink">
              {order.deliveryMethod === 'collection'
                ? 'Collecting from premises'
                : `${order.town ? `${order.town}, ` : ''}${order.county}`}
            </dd>
          </div>
          {order.deliveryNotes && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Notes</dt>
              <dd className="text-right text-oriel-navy-ink">{order.deliveryNotes}</dd>
            </div>
          )}
          {order.isBusiness && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Business</dt>
              <dd className="text-right text-oriel-navy-ink">
                {order.companyName}
                {order.kraPin ? ` · ${order.kraPin}` : ''}
              </dd>
            </div>
          )}
          {order.installationRequested && (
            <div className="flex justify-between gap-3">
              <dt className="text-oriel-slate">Installation</dt>
              <dd className="font-semibold text-oriel-green-deep">Requested</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Items */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
        <h2 className="t-h3">Items</h2>
        <ul className="mt-3 divide-y divide-oriel-line">
          {order.lines.map((line) => (
            <li key={line.slug} className="flex items-start justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className="block text-small text-oriel-navy-ink">{line.productName}</span>
                {line.modelCode && (
                  <span className="block font-mono text-[0.6875rem] text-oriel-slate">
                    {line.modelCode}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-small text-oriel-navy-ink">
                  {formatKes(line.unitPrice * line.quantity)}
                </span>
                <span className="block font-mono text-[0.6875rem] text-oriel-slate">
                  {line.quantity} × {formatKes(line.unitPrice)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-oriel-line pt-3">
          <span className="text-small font-semibold text-oriel-navy">Total</span>
          <span className="font-mono text-data font-medium text-oriel-navy-ink">
            {formatKes(order.total)}
          </span>
        </div>
      </section>

      {/* Status controls */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
        <h2 className="t-h3">Move this order on</h2>
        <div className="mt-3">
          <StatusControls orderNumber={order.orderNumber} status={order.status} />
        </div>
        {isCod && order.status === 'out_for_delivery' && !paidPayment && (
          <p className="mt-3 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
            This order cannot be marked delivered until the M-Pesa payment has been taken above.
          </p>
        )}
      </section>

      {/* Payments */}
      {order.payments.length > 0 && (
        <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
          <h2 className="t-h3">Payment attempts</h2>
          <ul className="mt-3 divide-y divide-oriel-line">
            {order.payments.map((payment) => (
              <li key={payment.id} className="py-2.5 text-small">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={
                      payment.status === 'paid'
                        ? 'font-semibold text-oriel-green-deep'
                        : 'text-oriel-navy-ink'
                    }
                  >
                    {payment.status}
                  </span>
                  <span className="font-mono text-oriel-navy-ink">{formatKes(payment.amount)}</span>
                </div>
                <p className="mt-0.5 font-mono text-[0.6875rem] text-oriel-slate">
                  {payment.phone} · {new Date(payment.at).toLocaleString('en-KE')}
                  {payment.actor ? ` · ${payment.actor}` : ''}
                </p>
                {payment.mpesaReceipt && (
                  <p className="mt-0.5 font-mono text-micro text-oriel-navy-ink">
                    Receipt {payment.mpesaReceipt}
                  </p>
                )}
                {payment.amountChangeReason && (
                  <p className="mt-0.5 text-micro text-oriel-slate">
                    Amount changed: {payment.amountChangeReason}
                  </p>
                )}
                {payment.resultDesc && payment.status !== 'paid' && (
                  <p className="mt-0.5 text-micro text-oriel-slate">{payment.resultDesc}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Paperwork. The invoice is raised when the order is placed and the
          receipt when the money lands, so this list is normally already
          populated — it is here to be reprinted or resent, not created. */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
        <h2 className="t-h3">Invoices &amp; receipts</h2>
        {documents.length === 0 ? (
          <p className="mt-3 text-small text-oriel-slate">
            Nothing raised for this order yet.{' '}
            <Link href="/admin/invoices/new" className="font-semibold text-oriel-navy underline">
              Write one by hand
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-oriel-line">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/admin/invoices/${doc.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-oriel-orange"
                >
                  <span className="min-w-0">
                    <span className="block font-mono text-small text-oriel-navy-ink">
                      {doc.docNumber ?? 'Draft'}
                    </span>
                    <span className="block text-micro text-oriel-slate">
                      {doc.docType === 'receipt' ? 'Receipt' : 'Invoice'} ·{' '}
                      {DOCUMENT_STATUS_LABEL[doc.status]}
                      {doc.lastSentAt ? ` · emailed ${doc.lastSentTo}` : ' · not sent'}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-small text-oriel-navy-ink">
                    {formatKes(doc.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timeline */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-4">
        <h2 className="t-h3">Timeline</h2>
        <ol className="mt-3 space-y-2.5">
          {order.events.map((event, i) => (
            <li key={`${event.event}-${i}`} className="flex gap-2.5 text-small">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange" aria-hidden />
              <span>
                <span className="block text-oriel-navy-ink">{event.note ?? event.event}</span>
                <span className="font-mono text-[0.6875rem] text-oriel-slate">
                  {new Date(event.at).toLocaleString('en-KE')} · {event.actor}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <a
        href={`/order/${order.orderNumber}?token=${order.accessToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-small font-medium text-oriel-slate hover:text-oriel-navy"
      >
        <ExternalLink size={15} strokeWidth={1.5} /> View the customer&apos;s order page
      </a>
    </div>
  );
}
