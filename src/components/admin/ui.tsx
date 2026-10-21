import Link from 'next/link';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared admin primitives.
 *
 * The admin used to compose the same white-card-on-mist markup by hand on
 * every page, so each screen drifted a little from the last — different
 * paddings, three shades of label, numbers sometimes in the body face. These
 * primitives are the whole visual language in one file: change a radius here
 * and the entire back office changes with it.
 *
 * The look follows the dashboard reference the client supplied: quiet mist
 * page, white cards with a hairline border and almost no shadow, a soft tinted
 * disc behind each stat icon, and trend deltas as small pills. Only three
 * colours carry meaning, which is what keeps it calm:
 *
 *   navy    structure, headings, the active state, anything neutral
 *   green   good news — money in, margin, stock healthy, paid
 *   orange  wants a human — low stock, unpaid, needs review, destructive
 *
 * Gold stays for the sun motif and nothing else. Every value is a brand token;
 * the palette is fixed by the brief.
 */

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest',
        padded && 'p-5',
        className
      )}
    >
      {children}
    </section>
  );
}

/** Card heading with an optional action on the right. */
export function CardHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-micro text-oriel-slate">{hint}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 whitespace-nowrap rounded-pill border border-oriel-line px-3 py-1.5 text-micro font-semibold text-oriel-navy transition-colors hover:border-oriel-orange hover:text-oriel-orange"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Page title block. Sits at the top of every admin screen. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-small text-oriel-slate">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * A card built as three bands: a titled header, a divided list, and a footer
 * carrying the one link that leads out of it.
 *
 * Stitch draws every list this way rather than as a single padded box — the
 * rules run the full width of the card instead of stopping inside the padding,
 * and the footer sits on a faint mist tint so "Manage stock" reads as the way
 * out rather than as another row of data. Rows supply their own `px-5 py-3`.
 */
export function ListCard({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  footer?: { label: string; href: string };
}) {
  return (
    <section className="flex h-full flex-col rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest">
      <div className="border-b border-oriel-line p-5 pb-4">
        <h2 className="font-headline text-[1.0625rem] font-semibold tracking-tight text-oriel-navy">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-micro text-oriel-slate">{hint}</p>}
      </div>
      <div className="flex-1">{children}</div>
      {footer && (
        <div className="mt-auto rounded-b-card border-t border-oriel-line bg-oriel-mist/20 p-4">
          <Link
            href={footer.href}
            className="flex w-full items-center justify-center gap-1.5 text-caption font-semibold text-oriel-navy transition-colors hover:text-oriel-orange"
          >
            {footer.label}
            <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Data display                                                                */
/* -------------------------------------------------------------------------- */

type Tone = 'plain' | 'green' | 'gold' | 'orange' | 'navy';

/** Soft disc behind a stat icon — the reference's one flash of colour per card. */
const DISC: Record<Tone, string> = {
  plain: 'bg-oriel-mist text-oriel-slate',
  green: 'bg-oriel-green-soft text-oriel-green-deep',
  gold: 'bg-oriel-gold-soft text-oriel-navy-ink',
  orange: 'bg-oriel-orange-soft text-oriel-orange-deep',
  navy: 'bg-oriel-navy/10 text-oriel-navy',
};

const VALUE_TONE: Record<Tone, string> = {
  plain: 'text-oriel-navy-ink',
  green: 'text-oriel-green-deep',
  gold: 'text-oriel-navy-ink',
  orange: 'text-oriel-orange-deep',
  navy: 'text-oriel-navy-ink',
};

/**
 * A small delta pill. Green when the number moved the way you want it to,
 * orange when it did not — never red, which is not in the palette.
 */
export function Trend({ value, direction }: { value: string; direction: 'up' | 'down' }) {
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 font-mono text-[0.6875rem] font-medium',
        direction === 'up'
          ? 'bg-oriel-green-soft text-oriel-green-deep'
          : 'bg-oriel-orange-soft text-oriel-orange-deep'
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden />
      {value}
    </span>
  );
}

/**
 * A single figure. The number is the loudest thing in the card and always
 * monospaced — every number in this build is, per the brief, and it also means
 * a column of figures lines up digit for digit when you are scanning.
 *
 * `icon` and `trend` are optional: the dashboard uses both, the inventory
 * summary uses neither, and the card reads correctly either way.
 */
export function StatCard({
  label,
  value,
  sub,
  tone = 'plain',
  href,
  icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  href?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: 'up' | 'down' };
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-headline text-small font-semibold text-oriel-navy">{label}</p>
          {sub && <p className="mt-0.5 truncate text-micro text-oriel-slate">{sub}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill',
              DISC[tone]
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className={cn('font-mono text-[1.625rem] font-medium leading-none', VALUE_TONE[tone])}>
          {value}
        </p>
        {trend && <Trend {...trend} />}
      </div>
    </>
  );

  const base = 'rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest';

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          'block transition-all duration-200 ease-oriel-out hover:-translate-y-0.5 hover:border-oriel-navy hover:shadow-oriel-lift'
        )}
      >
        {inner}
      </Link>
    );
  }
  return <div className={base}>{inner}</div>;
}

/**
 * A queue tile — a job to do, with a count. Larger and more assertive than a
 * StatCard because these are the things the day is actually run from, so the
 * tinted disc is filled rather than soft and the count sits at display size.
 */
export function QueueTile({
  label,
  hint,
  count,
  icon,
  href,
  tone = 'navy',
}: {
  label: string;
  hint: string;
  count: string;
  icon: React.ReactNode;
  href?: string;
  tone?: Tone;
}) {
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill',
            DISC[tone]
          )}
          aria-hidden
        >
          {icon}
        </span>
        <span className="font-mono text-[1.625rem] font-medium leading-none text-oriel-navy-ink">
          {count}
        </span>
      </span>
      <span className="block">
        <span className="block font-headline text-[1.0625rem] font-semibold text-oriel-navy">
          {label}
        </span>
        <span className="mt-0.5 block text-micro text-oriel-slate">{hint}</span>
      </span>
    </>
  );

  // Stitch sets these as a fixed-height column — disc and figure on the top
  // line, the naming underneath — rather than the single horizontal row they
  // used to be. The height is what keeps the three tiles agreeing with each
  // other when one hint wraps to two lines and the others do not.
  const base =
    'flex min-h-[10rem] flex-col justify-between rounded-card border border-oriel-line bg-oriel-white p-5 shadow-oriel-rest';

  const HOVER_BORDER: Record<Tone, string> = {
    plain: 'hover:border-oriel-navy',
    green: 'hover:border-oriel-green',
    gold: 'hover:border-oriel-gold',
    orange: 'hover:border-oriel-orange',
    navy: 'hover:border-oriel-navy',
  };

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          'transition-all duration-200 ease-oriel-out hover:-translate-y-0.5 hover:shadow-oriel-lift',
          HOVER_BORDER[tone]
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

/** Status pill. One vocabulary of colour for state across the whole admin. */
export function Pill({
  children,
  tone = 'plain',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone | 'danger';
  className?: string;
}) {
  const tones: Record<string, string> = {
    plain: 'bg-oriel-mist text-oriel-slate',
    navy: 'bg-oriel-navy text-oriel-white',
    green: 'bg-oriel-green-soft text-oriel-green-deep',
    gold: 'bg-oriel-gold-soft text-oriel-navy-ink',
    orange: 'bg-oriel-orange-soft text-oriel-orange-deep',
    danger: 'bg-oriel-orange text-oriel-white',
  };
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center whitespace-nowrap rounded-pill px-3 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.12em]',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Table shell. Wide tables scroll inside their own card rather than pushing
 * the page sideways — the admin is used one-handed on a phone at a gate.
 */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest">
      <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-oriel-line bg-oriel-mist px-4 py-3 text-eyebrow font-semibold uppercase text-oriel-slate',
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn('border-b border-oriel-line px-4 py-3 text-small text-oriel-navy-ink', className)}>
      {children}
    </td>
  );
}

/**
 * Filter chips. Scrolls horizontally on a phone rather than wrapping to three
 * rows and pushing the list itself below the fold.
 */
export function FilterChips({
  filters,
  active,
  hrefFor,
}: {
  filters: { id: string; label: string; count?: number }[];
  active: string;
  hrefFor: (id: string) => string;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-2 pb-0.5">
        {filters.map((f) => {
          const on = active === f.id;
          return (
            <li key={f.id || 'all'}>
              <Link
                href={hrefFor(f.id)}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border px-4 text-small font-medium transition-colors',
                  on
                    ? 'border-oriel-navy bg-oriel-navy text-oriel-white'
                    : 'border-oriel-line bg-oriel-white text-oriel-navy-ink hover:border-oriel-navy'
                )}
              >
                {f.label}
                {f.count != null && (
                  <span
                    className={cn(
                      'font-mono text-micro',
                      on ? 'text-oriel-white/80' : 'text-oriel-slate'
                    )}
                  >
                    {f.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Shown in place of a list when there is genuinely nothing to show. */
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-card border border-dashed border-oriel-line bg-oriel-mist/60 px-5 py-8 text-center">
      <p className="text-small font-medium text-oriel-navy">{title}</p>
      {hint && <p className="mt-1 text-micro text-oriel-slate">{hint}</p>}
    </div>
  );
}

/** Inline "go here next" link with the brand's arrow affordance. */
export function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-small font-semibold text-oriel-navy transition-colors hover:text-oriel-orange"
    >
      {children}
      <ArrowRight size={15} strokeWidth={1.5} />
    </Link>
  );
}
