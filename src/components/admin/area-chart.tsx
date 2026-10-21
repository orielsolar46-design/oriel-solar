import { cn } from '@/lib/utils';

/**
 * The dashboard's one chart.
 *
 * A smooth area with a gradient falling away underneath, which is the shape
 * the client's reference uses and the right one for a daily count: the eye
 * reads the trend off the slope without having to compare fourteen bar
 * heights.
 *
 * It is a server component with no charting library. The whole thing is one
 * SVG path, so it costs nothing on the client and renders identically in the
 * first paint — which matters on a phone at the far end of a Nairobi 3G cell.
 *
 * Hover detail comes from a `<title>` inside a transparent hit rectangle per
 * point. Native tooltips are not pretty, but they work without JavaScript and
 * they are announced by screen readers, which a custom div would not be.
 */

type Point = { label: string; value: number; caption: string };

/**
 * Cardinal spline through the points, expressed as cubic beziers. Tension is
 * deliberately low (0.18): high tension overshoots on a spiky series and draws
 * a curve that dips below zero orders, which would be a lie about the data.
 */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const t = 0.18;
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;

    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)},` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)},` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function AreaChart({
  points,
  className,
  tone = 'green',
}: {
  points: Point[];
  className?: string;
  /** green reads as volume/good news; navy is the neutral structural option. */
  tone?: 'green' | 'navy';
}) {
  const W = 720;
  const H = 220;
  const padTop = 18;
  const padBottom = 26;

  const stroke = tone === 'green' ? '#3FA535' : '#0B2A6B';
  const gradientId = `oriel-area-${tone}`;

  // A flat series still needs a sensible ceiling, or every point lands on the
  // baseline and the chart reads as "no orders" when it means "one a day".
  const peak = Math.max(1, ...points.map((p) => p.value));
  const plotH = H - padTop - padBottom;

  const coords = points.map((p, i) => ({
    x: points.length === 1 ? W / 2 : (i / (points.length - 1)) * W,
    y: padTop + plotH - (p.value / peak) * plotH,
  }));

  const line = smoothPath(coords);
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1].x.toFixed(2)} ${H - padBottom} L ${coords[0].x.toFixed(
          2
        )} ${H - padBottom} Z`
      : '';

  // Three guides: peak, half, zero. More than that is graph paper.
  const guides = [0, 0.5, 1].map((f) => padTop + plotH * f);

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full sm:h-52"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Orders per day. Peak ${peak}.`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {guides.map((y, i) => (
          <line
            key={i}
            x1="0"
            x2={W}
            y1={y}
            y2={y}
            stroke="#DCE3F0"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeDasharray={i === 2 ? undefined : '4 6'}
          />
        ))}

        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {coords.map((c, i) => (
          <g key={points[i].label}>
            {/* Transparent column so the whole vertical strip is hoverable,
                not just the two-pixel dot. */}
            <rect
              x={c.x - W / Math.max(points.length, 1) / 2}
              y={0}
              width={W / Math.max(points.length, 1)}
              height={H}
              fill="transparent"
            >
              <title>{points[i].caption}</title>
            </rect>
            <circle
              cx={c.x}
              cy={c.y}
              r="3"
              fill="#FFFFFF"
              stroke={stroke}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>

      <ul className="mt-1 flex justify-between font-mono text-[0.625rem] text-oriel-slate">
        {points.map((p, i) => (
          <li
            key={p.label}
            // Every other label on a phone, all of them once there is room.
            className={cn(i % 2 === 1 && 'hidden sm:block')}
          >
            {p.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
