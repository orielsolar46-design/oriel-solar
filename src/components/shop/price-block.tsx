import Link from 'next/link';
import { formatKes } from '@/lib/shop';

/**
 * Price display. Three states, all honest:
 *  - priced: mono figure, with KES/W beneath for panels;
 *  - quote-only (> KES 500,000): no figure, a request-a-quote line;
 *  - unpriced (retail markup not yet confirmed): a plain statement, no invention.
 */
export function PriceBlock({
  retailPrice,
  quoteOnly,
  pricePerWatt,
  slug,
  size = 'card',
}: {
  retailPrice: number | null;
  quoteOnly: boolean;
  pricePerWatt: number | null;
  slug: string;
  size?: 'card' | 'pdp';
}) {
  const figure = size === 'pdp' ? 'text-h2 font-medium' : 'text-data font-medium';

  if (quoteOnly) {
    return (
      <div>
        <p className={`font-mono ${size === 'pdp' ? 'text-h3' : 'text-data'} text-oriel-navy`}>
          Request a quote
        </p>
        <p className="mt-0.5 text-micro text-oriel-slate">
          Priced per project — sent within one working day
        </p>
      </div>
    );
  }

  if (retailPrice == null) {
    return (
      <div>
        <p className="text-small font-medium text-oriel-slate">Price being confirmed</p>
        <Link
          href={`/request-a-quote?product=${slug}`}
          className="text-caption font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2 hover:text-oriel-orange"
        >
          Ask for today&apos;s price
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className={`font-mono ${figure} text-oriel-navy-ink`}>{formatKes(retailPrice)}</p>
      {/* The figure is still VAT-inclusive; the label is not shown while a
          customer is browsing. The tax position is stated at the basket, at
          checkout, on the order confirmation, in the FAQ and in the terms. */}
      {pricePerWatt != null && (
        <p className="mt-0.5 font-mono text-micro text-oriel-slate">KES {pricePerWatt}/W</p>
      )}
    </div>
  );
}
