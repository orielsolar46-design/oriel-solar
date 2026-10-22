import Link from 'next/link';
import { Check, Clock, Package } from 'lucide-react';
import { DeliveryIcon, MpesaMark, WhatsAppIcon } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import type { OrderRecord, OrderStatus } from '@/lib/orders/store';
import { PaymentPanel } from '@/components/orders/payment-panel';
import { CONTACT } from '@/lib/navigation';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * Shared order view, used by the confirmation page and by order tracking.
 * Never renders a payment figure the server did not compute.
 */

const STATUS_COPY: Record<OrderStatus, { label: string; detail: string; tone: 'wait' | 'good' | 'bad' }> = {
  pending_payment: {
    label: 'Waiting for your M-Pesa payment',
    detail:
      'Check your phone for the M-Pesa request and enter your PIN to approve it. This page updates as soon as payment is confirmed.',
    tone: 'wait',
  },
  paid: {
    label: 'Payment received',
    detail: 'We have your payment and your order is being prepared.',
    tone: 'good',
  },
  payment_failed: {
    label: 'Payment did not complete',
    detail: 'Nothing has been charged. You can try again, or pay from a different M-Pesa number.',
    tone: 'bad',
  },
  pending_cod: {
    label: 'Order confirmed — pay on delivery by M-Pesa',
    detail:
      'Our team will send the M-Pesa request to your phone when the goods are with you. You approve it at handover — no cash needed.',
    tone: 'good',
  },
  processing: { label: 'Being picked and packed', detail: 'Your order is being prepared for dispatch.', tone: 'good' },
  out_for_delivery: {
    label: 'Out for delivery',
    detail: 'Your order is on its way. Keep your phone nearby.',
    tone: 'good',
  },
  delivered: { label: 'Delivered', detail: 'Your order has been handed over. Thank you.', tone: 'good' },
  cancelled: { label: 'Cancelled', detail: 'This order was cancelled. Nothing has been charged.', tone: 'bad' },
  refunded: { label: 'Refunded', detail: 'This order has been refunded.', tone: 'bad' },
};

export function OrderSummary({ order }: { order: OrderRecord }) {
  const status = STATUS_COPY[order.status];
  const paid = order.payments.find((p) => p.status === 'paid');

  return (
    <div className="mx-auto max-w-3xl">
      <p className="t-eyebrow text-oriel-slate">Order</p>
      <h1 className="t-h1 mt-1 font-mono">{order.orderNumber}</h1>

      {/* Status */}
      <div
        className={cn(
          'mt-6 flex items-start gap-3 rounded-card p-5',
          status.tone === 'good'
            ? 'bg-oriel-green-soft'
            : status.tone === 'wait'
              ? 'bg-oriel-gold-soft'
              : 'bg-oriel-mist'
        )}
      >
        <span className="mt-0.5 shrink-0">
          {status.tone === 'good' ? (
            <Check size={20} strokeWidth={2} className="text-oriel-green-deep" aria-hidden />
          ) : status.tone === 'wait' ? (
            <Clock size={20} strokeWidth={1.5} className="text-oriel-navy-ink" aria-hidden />
          ) : (
            <Package size={20} strokeWidth={1.5} className="text-oriel-slate" aria-hidden />
          )}
        </span>
        <span>
          <span className="block font-display text-[1.0625rem] font-semibold text-oriel-navy">
            {status.label}
          </span>
          <span className="mt-1 block text-small text-oriel-navy-ink">{status.detail}</span>
          {paid?.mpesaReceipt && (
            <span className="mt-2 block font-mono text-data text-oriel-navy-ink">
              M-Pesa receipt: {paid.mpesaReceipt}
            </span>
          )}
        </span>
      </div>

      {(order.status === 'pending_payment' || order.status === 'payment_failed') && (
        <div className="mt-4">
          <PaymentPanel
            orderNumber={order.orderNumber}
            token={order.accessToken}
            amount={order.total}
            phone={order.phone}
            initiallyPaid={false}
          />
          <p className="mt-3 text-center text-caption text-oriel-slate">
            Trouble paying? Call {CONTACT.phonePrimary} and we will take it over the phone.
          </p>
        </div>
      )}

      {/* Items */}
      <section aria-labelledby="order-items" className="mt-8">
        <h2 id="order-items" className="t-h3">
          What you ordered
        </h2>
        <ul className="mt-3 divide-y divide-oriel-line border-y border-oriel-line">
          {order.lines.map((line) => (
            <li key={line.slug} className="flex items-start justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block text-small font-semibold text-oriel-navy">
                  {line.productName}
                </span>
                {line.modelCode && (
                  <span className="mt-0.5 block font-mono text-micro text-oriel-slate">
                    {line.modelCode}
                  </span>
                )}
                {line.withInstallation && (
                  <span className="mt-1 block text-caption font-medium text-oriel-green-deep">
                    With professional installation
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-data text-oriel-navy-ink">
                  {formatKes(line.unitPrice * line.quantity)}
                </span>
                <span className="block font-mono text-micro text-oriel-slate">
                  {line.quantity} × {formatKes(line.unitPrice)}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 text-small">
          <div className="flex justify-between">
            <dt className="text-oriel-slate">Subtotal</dt>
            <dd className="font-mono text-oriel-navy-ink">{formatKes(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-oriel-slate">
              {order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}
            </dt>
            <dd className={order.deliveryFee === 0 ? 'text-oriel-green-deep' : 'text-oriel-slate'}>
              {order.deliveryFee === 0
                ? 'Free'
                : order.deliveryFee != null
                  ? formatKes(order.deliveryFee)
                  : 'Paid on delivery'}
            </dd>
          </div>
          <div className="flex justify-between border-t border-oriel-line pt-2">
            <dt className="font-semibold text-oriel-navy">
              {order.deliveryFee == null ? 'Total for goods' : 'Total'}
            </dt>
            <dd className="font-mono text-data font-medium text-oriel-navy-ink">
              {formatKes(order.total)}
            </dd>
          </div>
        </dl>
        <p className="mt-1 text-right text-micro text-oriel-slate">Incl. 16% VAT</p>
      </section>

      {/* Delivery details */}
      <section aria-labelledby="order-delivery" className="mt-8">
        <h2 id="order-delivery" className="t-h3">
          {order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'}
        </h2>
        <div className="mt-3 space-y-1 text-small text-oriel-navy-ink">
          <p>{order.customerName}</p>
          <p className="font-mono">{order.phone}</p>
          {order.deliveryMethod === 'collection' ? (
            <p>Collection in Nairobi — we will confirm the point and time when your order is ready</p>
          ) : (
            <p>
              {order.town ? `${order.town}, ` : ''}
              {order.county}
            </p>
          )}
          {order.deliveryNotes && <p className="text-oriel-slate">{order.deliveryNotes}</p>}
          {order.installationRequested && (
            <p className="text-oriel-green-deep">
              Professional installation requested — we will confirm the fee and date with you.
            </p>
          )}
        </div>
      </section>

      {/* Payment method reminder — COD is M-Pesa, never cash */}
      <div className="mt-8 flex items-start gap-3 rounded-card border border-oriel-line p-4">
        {order.paymentOption === 'pay_now' ? (
          <MpesaMark height={15} className="mt-1 shrink-0" />
        ) : (
          <DeliveryIcon size={16} className="mt-0.5 shrink-0" />
        )}
        <p className="text-small text-oriel-navy-ink">
          {order.paymentOption === 'pay_now'
            ? 'You chose to pay now by M-Pesa. The request goes to the phone number above.'
            : 'You chose to pay on delivery by M-Pesa. Our team sends the request to the phone number above at handover — no cash is needed.'}
        </p>
      </div>

      {/* Event timeline */}
      <section aria-labelledby="order-events" className="mt-8">
        <h2 id="order-events" className="t-h3">
          Progress
        </h2>
        <ol className="mt-3 space-y-3">
          {order.events.map((event) => (
            <li key={`${event.event}-${event.at}`} className="flex gap-3 text-small">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange" aria-hidden />
              <span>
                <span className="block text-oriel-navy-ink">{event.note ?? event.event}</span>
                <time className="font-mono text-micro text-oriel-slate" dateTime={event.at}>
                  {new Date(event.at).toLocaleString('en-KE')}
                </time>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 border-t border-oriel-line pt-6">
        <Button asChild variant="whatsapp">
          <a
            href={`${CONTACT.whatsapp}?text=${encodeURIComponent(`Hello Oriel Power — a question about order ${order.orderNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={16} /> Ask about this order
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
