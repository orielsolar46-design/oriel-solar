import { cn } from '@/lib/utils';

/**
 * The Sun Arc — the brand's signature element (MASTERPLAN V2 2.5).
 * A geometric arc with the gold→orange vertical gradient, rising from a 2px
 * green baseline — mirroring the logo, and the one place all three brand
 * colours meet. Used in exactly four places: the home hero horizon, the
 * checkout progress indicator, the M-Pesa waiting modal's pulsing state, and
 * the footer flourish. Nowhere else. (The fifth — the sizing calculator's
 * results gauge — went with the calculator when it was removed.)
 */
export function SunArc({
  className,
  strokeWidth = 3,
  id = 'sun-arc-gradient',
  baseline = true,
}: {
  className?: string;
  strokeWidth?: number;
  /** Unique gradient id when several arcs appear on one page. */
  id?: string;
  /** The 2px green baseline the arc rises from. On by default. */
  baseline?: boolean;
}) {
  return (
    <svg
      className={cn('block w-full', className)}
      viewBox="0 0 1200 200"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDB913" />
          <stop offset="100%" stopColor="#F26A21" />
        </linearGradient>
      </defs>
      {baseline && (
        <line
          x1="0"
          y1="190"
          x2="1200"
          y2="190"
          stroke="#3FA535"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path
        d="M 0 190 Q 600 -60 1200 190"
        stroke={`url(#${id})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
