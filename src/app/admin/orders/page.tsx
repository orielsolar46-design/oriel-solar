import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { listOrders } from '@/lib/orders/store';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';
import { EmptyState, FilterChips, PageHeader, Pill } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'pending_cod', label: 'Pay on delivery' },
  { id: 'pending_payment', label: 'Awaiting payment' },
  { id: 'paid', label: 'Paid' },
  { id: 'delivered', label: 'Delivered' },
];

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

/** Settled money is green, in-flight is gold, dead orders are quiet. */
function statusTone(status: string): 'green' | 'gold' | 'plain' {
  if (status === 'delivered' || status === 'paid') return 'green';
  if (status === 'payment_failed' || status === 'cancelled' || status === 'refunded') return 'plain';
  return 'gold';
}

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const all = await listOrders();
  const status = searchParams.status ?? '';
  const orders = status ? all.filter((o) => o.status === status) : all;

  const filters = FILTERS.map((f) => ({
    ...f,
    count: f.id ? all.filter((o) => o.status === f.id).length : all.length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'}${
          status ? ` · ${STATUS_LABEL[status] ?? status}` : ''
        }`}
      />

      <FilterChips
        filters={filters}
        active={status}
        hrefFor={(id) => (id ? `/admin/orders?status=${id}` : '/admin/orders')}
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders in this view"
          hint={status ? 'Try another filter, or clear it to see everything.' : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => {
            const unpaidCod =
              order.paymentOption === 'pay_on_delivery' &&
              !order.payments.some((p) => p.status === 'paid');
            return (
              <li key={order.orderNumber}>
                <Link
                  href={`/admin/orders/${order.orderNumber}`}
                  className={cn(
                    'block rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest transition-all duration-200 ease-oriel-out hover:-translate-y-0.5 hover:shadow-oriel-lift',
                    // Settled orders lift to navy, anything still wanting a
                    // human lifts to orange — the same split the pills use.
                    statusTone(order.status) === 'green'
                      ? 'hover:border-oriel-navy'
                      : 'hover:border-oriel-orange'
                  )}
                >
                  <span className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <span className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:gap-6">
                      <span className="shrink-0 font-mono text-small font-medium text-oriel-navy">
                        {order.orderNumber}
                      </span>
                      <span className="truncate text-small text-oriel-navy-ink">
                        {order.customerName} · {order.county}
                      </span>
                    </span>
                    <span className="flex flex-col items-start gap-3 md:flex-row md:items-center md:gap-6">
                      <span className="flex flex-wrap items-center gap-2">
                        <Pill tone={statusTone(order.status)}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </Pill>
                        {unpaidCod && <Pill tone="orange">Payment due at handover</Pill>}
                        {/* Stitch pairs a failed payment with a second pill
                            saying so out loud — the quiet mist pill alone reads
                            as settled when it is the opposite. */}
                        {order.status === 'payment_failed' && (
                          <Pill tone="orange">Action required</Pill>
                        )}
                      </span>
                      <span className="shrink-0 text-left md:text-right">
                        <span className="block font-mono text-small font-medium text-oriel-navy-ink">
                          {formatKes(order.total)}
                        </span>
                        <span className="mt-1 block font-mono text-[0.6875rem] text-oriel-slate">
                          {new Date(order.createdAt).toLocaleDateString('en-KE')}
                        </span>
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
