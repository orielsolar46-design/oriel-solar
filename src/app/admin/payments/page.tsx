import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getPayments } from '@/lib/admin/data';
import { formatKes } from '@/lib/shop';
import { EmptyState, FilterChips, PageHeader, Pill } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminPayments({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const all = await getPayments();
  const status = searchParams.status ?? '';
  const payments = status ? all.filter((p) => p.status === status) : all;
  const totalPaid = all.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        subtitle="Every M-Pesa attempt, for reconciliation against the M-Pesa statement."
      >
        <span className="rounded-card border border-oriel-line bg-oriel-white px-4 py-2 text-right shadow-oriel-rest">
          <span className="block text-eyebrow uppercase text-oriel-slate">Received</span>
          <span className="block font-mono text-small font-medium text-oriel-green-deep">
            {formatKes(totalPaid)}
          </span>
        </span>
      </PageHeader>

      <FilterChips
        filters={[
          { id: '', label: 'All', count: all.length },
          { id: 'paid', label: 'Paid', count: all.filter((x) => x.status === 'paid').length },
          { id: 'failed', label: 'Failed', count: all.filter((x) => x.status === 'failed').length },
          {
            id: 'cancelled',
            label: 'Cancelled',
            count: all.filter((x) => x.status === 'cancelled').length,
          },
          {
            id: 'initiated',
            label: 'Awaiting',
            count: all.filter((x) => x.status === 'initiated').length,
          },
        ]}
        active={status}
        hrefFor={(id) => (id ? `/admin/payments?status=${id}` : '/admin/payments')}
      />

      {payments.length === 0 ? (
        <EmptyState title="No payment attempts in this view" />
      ) : (
        <ul className="space-y-2">
          {payments.map((p, i) => (
            <li
              key={`${p.orderNumber}-${p.at}-${i}`}
              className="rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/orders/${p.orderNumber}`}
                    className="font-mono text-small font-medium text-oriel-navy hover:text-oriel-orange"
                  >
                    {p.orderNumber}
                  </Link>
                  <p className="text-small text-oriel-navy-ink">{p.customerName}</p>
                  <p className="font-mono text-[0.6875rem] text-oriel-slate">
                    {p.phone} · {new Date(p.at).toLocaleString('en-KE')}
                    {p.actor ? ` · ${p.actor}` : ''}
                  </p>
                  {p.receipt && (
                    <p className="mt-1 font-mono text-micro text-oriel-navy-ink">
                      Receipt {p.receipt}
                    </p>
                  )}
                  {p.resultDesc && p.status !== 'paid' && (
                    <p className="mt-0.5 text-micro text-oriel-slate">{p.resultDesc}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <Pill
                    tone={p.status === 'paid' ? 'green' : p.status === 'initiated' ? 'gold' : 'plain'}
                  >
                    {p.status}
                  </Pill>
                  <p className="mt-1.5 font-mono text-data font-medium text-oriel-navy-ink">
                    {formatKes(p.amount)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
