import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The channel badge: the one claim the client makes about its standing with
 * a brand. It is written down once per brand in `src/lib/brands.ts`, and it
 * is shown on the home page row and on the brand's own page so the same
 * words appear in the rendered page, the structured data and the text an AI
 * crawler reads.
 */
export function VerifiedBadge({
  label,
  href,
  tone = 'light',
  className,
}: {
  label: string;
  href?: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const body = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-eyebrow font-semibold uppercase tracking-[0.1em] transition-colors',
        tone === 'dark'
          ? 'border-oriel-gold/60 bg-oriel-gold/10 text-oriel-gold'
          : 'border-oriel-green/40 bg-oriel-green-soft text-oriel-green-deep',
        href && 'hover:border-oriel-orange hover:text-oriel-orange',
        className
      )}
    >
      <ShieldCheck size={14} strokeWidth={2} aria-hidden />
      {label}
    </span>
  );

  if (!href) return body;

  return (
    <Link href={href} className="inline-flex" aria-label={label}>
      {body}
    </Link>
  );
}
