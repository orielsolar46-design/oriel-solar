import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Server-rendered pagination (MASTERPLAN 7.2). Links carry the full filter
 * query so every page is shareable; rel prev/next assists crawling.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v && k !== 'page') qs.set(k, v);
    }
    if (p > 1) qs.set('page', String(p));
    const s = qs.toString();
    return `${basePath}${s ? `?${s}` : ''}`;
  };

  const pages: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) pages.push(p);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link
          rel="prev"
          href={href(page - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-input border border-oriel-line text-oriel-navy transition-colors hover:bg-oriel-mist sm:h-10 sm:w-10"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </Link>
      )}
      {pages[0] > 1 && <span className="px-1 text-oriel-slate">…</span>}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-input font-mono text-data transition-colors sm:h-10 sm:w-10',
            p === page
              ? 'bg-oriel-navy text-oriel-white'
              : 'border border-oriel-line text-oriel-navy hover:bg-oriel-mist'
          )}
        >
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages && <span className="px-1 text-oriel-slate">…</span>}
      {page < totalPages && (
        <Link
          rel="next"
          href={href(page + 1)}
          className="flex h-11 w-11 items-center justify-center rounded-input border border-oriel-line text-oriel-navy transition-colors hover:bg-oriel-mist sm:h-10 sm:w-10"
          aria-label="Next page"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </Link>
      )}
    </nav>
  );
}
