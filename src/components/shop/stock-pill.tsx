import { Check, Clock, PackageSearch, Phone } from 'lucide-react';
import { STOCK_LABELS, STOCK_LABELS_SHORT } from '@/lib/shop';
import { cn } from '@/lib/utils';

/**
 * Stock status pill. Colour is never the sole carrier — every state pairs an
 * icon with a text label (MASTERPLAN 12, accessibility).
 */
export function StockPill({
  status,
  className,
  compact = false,
}: {
  status: 'in_stock' | 'low_stock' | 'on_order' | 'call_for_stock';
  className?: string;
  /** Card use: drops a size on a phone so "Call for availability" stays on one line. */
  compact?: boolean;
}) {
  const styles: Record<string, { chip: string; Icon: typeof Check }> = {
    in_stock: { chip: 'bg-oriel-green-soft text-oriel-green-deep', Icon: Check },
    low_stock: { chip: 'bg-oriel-green-soft text-oriel-green-deep', Icon: Check },
    on_order: { chip: 'bg-oriel-gold-soft text-oriel-navy-ink', Icon: Clock },
    call_for_stock: { chip: 'bg-oriel-mist text-oriel-slate', Icon: Phone },
  };
  const { chip, Icon } = styles[status] ?? { chip: 'bg-oriel-mist text-oriel-slate', Icon: PackageSearch };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 truncate rounded-pill font-semibold',
        compact
          ? 'px-1.5 py-0.5 text-[0.625rem] sm:px-2.5 sm:py-1 sm:text-micro'
          : 'px-2.5 py-1 text-micro',
        chip,
        className
      )}
    >
      <Icon size={12} strokeWidth={2} className="shrink-0" aria-hidden />
      {compact ? (
        <>
          <span className="sm:hidden">{STOCK_LABELS_SHORT[status]}</span>
          <span className="hidden sm:inline">{STOCK_LABELS[status]}</span>
        </>
      ) : (
        STOCK_LABELS[status]
      )}
    </span>
  );
}
