import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ArrowPill({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative isolate inline-flex h-11 shrink-0 items-center overflow-hidden rounded-pill border border-[#cfcfcf] bg-gradient-to-b from-white via-[#f0f0f0] to-[#d7d7d7] pl-4 pr-12 font-sans text-[0.75rem] font-extrabold uppercase leading-none tracking-[0.06em] text-oriel-green-deep shadow-[0_4px_0_#b7b7b7,0_8px_16px_rgba(10,23,51,0.16)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_0_#b7b7b7,0_12px_20px_rgba(10,23,51,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2 active:translate-y-0.5 active:shadow-[0_2px_0_#b7b7b7,0_4px_8px_rgba(10,23,51,0.16)] sm:h-12 sm:pr-14 sm:text-[0.8125rem] lg:pr-16',
        className
      )}
    >
      <span className="whitespace-nowrap [text-shadow:0_1px_0_rgba(255,255,255,0.9),0_2px_0_rgba(46,125,40,0.22)]">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-pill bg-gradient-to-b from-[#71de81] via-[#37b94e] to-[#128a32] shadow-[inset_1px_0_0_rgba(255,255,255,0.4),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(0,70,20,0.22)] sm:w-11 lg:w-12"
      >
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35 blur-[1px]" />
        <ChevronsRight
          size={20}
          strokeWidth={3.5}
          className="relative text-white drop-shadow-[0_2px_1px_rgba(0,80,20,0.5)] transition-transform duration-150 ease-out group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
