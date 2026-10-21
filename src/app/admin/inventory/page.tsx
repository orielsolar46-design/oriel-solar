import { redirect } from 'next/navigation';
import { AlertTriangle, ImageOff, PackageX, TrendingDown } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getInventoryReport } from '@/lib/admin/inventory';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';
import { Card, CardHeader, PageHeader, Pill, StatCard, Td, Th } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminInventory() {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const r = await getInventoryReport();

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Everything in the catalogue, and what it is worth." />

      {/* Money. Cost and retail are deliberately separate figures. */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Stock at cost"
          value={formatKes(r.costValue)}
          sub="What is on the shelf, at what you paid"
        />
        <StatCard
          label="Stock at retail"
          value={formatKes(r.retailValue)}
          sub="What it sells for, if it all sells"
        />
        <StatCard
          label="Margin in stock"
          value={formatKes(r.potentialMargin)}
          tone="green"
          sub="Retail less cost — not yet earned"
        />
      </div>

      <p className="rounded-card border border-oriel-line bg-oriel-mist px-4 py-3 text-micro text-oriel-slate">
        Value counts only the {r.withQty} of {r.totalProducts} products with a recorded quantity —
        {' '}{r.countedUnits} units in total. Anything without a count contributes nothing rather
        than a guess.
      </p>

      {/* Catalogue health */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Live on the shop"
          value={String(r.liveProducts)}
          sub={`of ${r.totalProducts}`}
          tone="green"
        />
        <StatCard
          label="Out of stock"
          value={String(r.outOfStock)}
          tone={r.outOfStock > 0 ? 'orange' : 'plain'}
          href="/admin/products?filter=low_stock"
        />
        <StatCard
          label="Low stock"
          value={String(r.lowStock)}
          sub="3 or fewer left"
          tone={r.lowStock > 0 ? 'gold' : 'plain'}
        />
        <StatCard
          label="Not on the shop"
          value={String(r.unpublished)}
          sub="Unpublished or unpriced"
        />
      </div>

      {/* Per category */}
      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="By category" hint="Where the value sits" />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr>
                <Th>Category</Th>
                <Th className="text-right">Items</Th>
                <Th className="text-right">Live</Th>
                <Th className="text-right">Out</Th>
                <Th className="text-right">Units</Th>
                <Th className="text-right">At retail</Th>
              </tr>
            </thead>
            <tbody>
              {r.categories.map((c) => (
                <tr key={c.category} className="transition-colors hover:bg-oriel-mist/60">
                  <Td className="font-medium text-oriel-navy">{c.category}</Td>
                  <Td className="text-right font-mono">{c.total}</Td>
                  <Td className="text-right font-mono">{c.live}</Td>
                  <Td
                    className={cn(
                      'text-right font-mono',
                      c.outOfStock > 0 && 'font-semibold text-oriel-orange-deep'
                    )}
                  >
                    {c.outOfStock || '—'}
                  </Td>
                  <Td className="text-right font-mono">{c.units || '—'}</Td>
                  <Td className="text-right font-mono">
                    {c.retailValue > 0 ? formatKes(c.retailValue) : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {r.outOfStockList.length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
            <PackageX size={18} strokeWidth={1.5} aria-hidden />
            Out of stock ({r.outOfStockList.length})
          </h2>
          <ul className="mt-4 space-y-1.5">
            {r.outOfStockList.slice(0, 30).map((p) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input border border-oriel-line bg-oriel-white px-3 py-2 text-small"
              >
                <span className="font-medium text-oriel-navy">{p.name}</span>
                <span className="font-mono text-micro text-oriel-slate">{p.category}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.lowStockList.length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
            <TrendingDown size={18} strokeWidth={1.5} aria-hidden />
            Running low ({r.lowStockList.length})
          </h2>
          <ul className="mt-4 space-y-1.5">
            {r.lowStockList.slice(0, 30).map((p) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input border border-oriel-line bg-oriel-white px-3 py-2 text-small"
              >
                <span className="font-medium text-oriel-navy">{p.name}</span>
                <span className="font-mono text-micro text-oriel-navy-ink">
                  {p.stockQty} left
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {r.attentionList.length > 0 && (
        <Card>
          <h2 className="flex items-center gap-2 font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
            <AlertTriangle size={18} strokeWidth={1.5} aria-hidden />
            Needs a look ({r.attentionList.length})
          </h2>
          <p className="mt-1 text-micro text-oriel-slate">
            Live but unbuyable, priced oddly, or missing a photograph.
          </p>
          <ul className="mt-4 space-y-1.5">
            {r.attentionList.map((p) => (
              <li
                key={p.slug}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input border border-oriel-line bg-oriel-white px-3 py-2 text-small"
              >
                <span className="font-medium text-oriel-navy">{p.name}</span>
                <span className="flex flex-wrap gap-1.5">
                  {p.retailPrice == null && <Pill tone="gold">No price</Pill>}
                  {p.priceStatus === 'needs_review' && <Pill tone="gold">Check price</Pill>}
                  {p.imageCount === 0 && (
                    <Pill className="gap-1">
                      <ImageOff size={11} strokeWidth={2} aria-hidden /> No photo
                    </Pill>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
