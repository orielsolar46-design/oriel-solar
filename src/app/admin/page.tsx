import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  CalendarDays,
  EyeOff,
  ImageOff,
  Package,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { DeliveryIcon } from '@/components/ui/brand-icons';
import { AppInstall } from '@/components/admin/app-install';
import { AreaChart } from '@/components/admin/area-chart';
import { getDashboardStats } from '@/lib/admin/data';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { formatKes } from '@/lib/shop';
import {
  Card,
  CardHeader,
  EmptyState,
  ListCard,
  PageHeader,
  QueueTile,
  StatCard,
} from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * Week-on-week change from the 14-day series.
 *
 * Returned only when the earlier week actually had something in it. Going from
 * nothing to something is not "+100%", it is just the first week — and a
 * percentage against zero is the kind of figure that gets repeated in a
 * meeting and then cannot be defended.
 */
function weekOnWeek(series: { count: number; value: number }[], key: 'count' | 'value') {
  if (series.length < 14) return undefined;
  const sum = (from: number, to: number) =>
    series.slice(from, to).reduce((s, d) => s + d[key], 0);
  const previous = sum(0, 7);
  const current = sum(7, 14);
  if (previous <= 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  return {
    value: `${change >= 0 ? '+' : ''}${change}%`,
    direction: (change >= 0 ? 'up' : 'down') as 'up' | 'down',
  };
}

export default async function AdminDashboard() {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const stats = await getDashboardStats();

  const averageOrder =
    stats.ordersMonth > 0 ? Math.round(stats.revenueMonth / stats.ordersMonth) : 0;

  const chartPoints = stats.dailySeries.map((d) => {
    const date = new Date(`${d.date}T00:00:00`);
    return {
      label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      value: d.count,
      caption: `${date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
      })}: ${d.count} ${d.count === 1 ? 'order' : 'orders'}, ${formatKes(d.value)}`,
    };
  });

  const health = [
    {
      label: 'Prices needing review',
      value: stats.needsReview,
      href: '/admin/products?filter=needs_review',
      icon: <AlertTriangle size={16} strokeWidth={1.5} aria-hidden />,
    },
    {
      label: 'Published without imagery',
      value: stats.missingImagery,
      href: '/admin/products?filter=no_images',
      icon: <ImageOff size={16} strokeWidth={1.5} aria-hidden />,
    },
    {
      label: 'Unpublished items',
      value: stats.unpublished,
      href: '/admin/products?filter=unpublished',
      icon: <EyeOff size={16} strokeWidth={1.5} aria-hidden />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle="Orders, payments and stock at a glance." />

      {/* Installing the app and switching on order alerts. Hides itself once
          both are done, so it is a first-run prompt rather than furniture. */}
      {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
        <AppInstall vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY} />
      )}

      {/* What needs doing today, before any reporting figure. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <QueueTile
          label="Out for delivery"
          hint="Tap to take payment at handover"
          count={String(stats.outForDelivery)}
          icon={<DeliveryIcon size={20} tone="mono" />}
          href="/admin/orders?status=out_for_delivery"
          tone="orange"
        />
        <QueueTile
          label="Awaiting payment"
          hint="Pay-now orders not completed"
          count={String(stats.awaitingPayment)}
          icon={<Package size={20} strokeWidth={1.5} />}
          href="/admin/orders?status=pending_payment"
          tone="navy"
        />
        <QueueTile
          label="Pay-on-delivery owed"
          hint={`Across ${stats.outstandingCodCount} ${
            stats.outstandingCodCount === 1 ? 'order' : 'orders'
          } not yet paid`}
          count={formatKes(stats.outstandingCodValue)}
          icon={<Wallet size={20} strokeWidth={1.5} />}
          tone="gold"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          sub="Paid orders, 30 days"
          value={formatKes(stats.revenueMonth)}
          tone="green"
          icon={<Wallet size={17} strokeWidth={1.5} />}
          trend={weekOnWeek(stats.dailySeries, 'value')}
        />
        <StatCard
          label="Orders"
          sub="Last 30 days"
          value={String(stats.ordersMonth)}
          tone="navy"
          icon={<ShoppingBag size={17} strokeWidth={1.5} />}
          trend={weekOnWeek(stats.dailySeries, 'count')}
          href="/admin/orders"
        />
        <StatCard
          label="Today"
          sub="Orders placed today"
          value={String(stats.ordersToday)}
          icon={<CalendarDays size={17} strokeWidth={1.5} />}
        />
        <StatCard
          label="This week"
          sub="Last 7 days"
          value={String(stats.ordersWeek)}
          icon={<CalendarDays size={17} strokeWidth={1.5} />}
        />
      </div>

      {/* The reference's analytic block: the headline figures sitting above the
          curve they came from, so the number and its shape are read together. */}
      <Card>
        {/* Stitch gives this card its title alone — no hint, no action. The
            figures and the curve are the content; the Orders KPI card above
            already links through to the list. */}
        <CardHeader title="Orders, last 14 days" />

        {/* Stitch runs these as a left-aligned row over a single rule rather
            than a boxed three-column grid — the figures read as one line of
            headline numbers, and the chart below is what they belong to. */}
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-b border-oriel-line pb-6">
          <div>
            <dt className="mb-1 text-micro text-oriel-slate">Revenue, 30 days</dt>
            <dd className="font-mono text-[1.25rem] font-medium leading-none text-oriel-green-deep">
              {formatKes(stats.revenueMonth)}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-micro text-oriel-slate">Orders, 30 days</dt>
            <dd className="font-mono text-[1.25rem] font-medium leading-none text-oriel-navy-ink">
              {stats.ordersMonth}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-micro text-oriel-slate">Average order</dt>
            <dd className="font-mono text-[1.25rem] font-medium leading-none text-oriel-navy-ink">
              {averageOrder > 0 ? formatKes(averageOrder) : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-8">
          <AreaChart points={chartPoints} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListCard
          title="Low stock"
          hint="Counted items running down"
          footer={{ label: 'Manage stock', href: '/admin/inventory' }}
        >
          {stats.lowStock.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Nothing running low"
                hint="Counted items are all above their threshold."
              />
            </div>
          ) : (
            <ul className="divide-y divide-oriel-line">
              {stats.lowStock.map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-oriel-mist/30"
                >
                  <span className="min-w-0 flex-1 truncate text-small font-medium text-oriel-navy-ink">
                    {p.name}
                  </span>
                  {/* Stitch sets the running-down count as an orange-soft pill,
                      not a bare figure — it is the one thing on the row that
                      wants a human. */}
                  <span className="shrink-0 rounded-pill bg-oriel-orange-soft px-2 py-0.5 font-mono text-caption font-medium text-oriel-orange-deep">
                    {p.stockQty} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ListCard>

        <ListCard
          title="Catalogue health"
          hint="What is holding products back"
          footer={{ label: 'Manage products', href: '/admin/products' }}
        >
          <ul className="divide-y divide-oriel-line">
            {health.map((row) => (
              <li key={row.label}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-oriel-mist/30 hover:text-oriel-orange"
                >
                  <span className="flex min-w-0 items-center gap-3 text-small font-medium text-oriel-navy-ink">
                    <span className="shrink-0 text-oriel-slate">{row.icon}</span>
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="font-mono text-caption font-medium text-oriel-slate">
                    {row.value}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ListCard>
      </div>

      {stats.topProducts.length > 0 && (
        <Card>
          <CardHeader title="Top products by order value" hint="Across all paid orders" />
          <ul className="mt-4 divide-y divide-oriel-line">
            {stats.topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-oriel-mist font-mono text-[0.6875rem] font-medium text-oriel-navy">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-small text-oriel-navy-ink">
                  {p.name}
                </span>
                <span className="shrink-0 font-mono text-micro text-oriel-slate">×{p.quantity}</span>
                <span className="w-28 shrink-0 text-right font-mono text-small font-medium text-oriel-navy-ink">
                  {formatKes(p.value)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
