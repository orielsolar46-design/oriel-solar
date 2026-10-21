'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpecSection = { id: string; title: string; content: React.ReactNode };

/**
 * Below-the-fold product information: tabs on desktop, an accordion on mobile
 * (MASTERPLAN 7.3). One component, two presentations, same content nodes.
 */
export function SpecSections({ sections }: { sections: SpecSection[] }) {
  const [active, setActive] = React.useState(sections[0]?.id);
  const [openIds, setOpenIds] = React.useState<Set<string>>(new Set([sections[0]?.id]));

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      {/* Desktop tabs */}
      <div className="hidden md:block">
        <div role="tablist" aria-label="Product information" className="flex flex-wrap gap-1 border-b border-oriel-line">
          {sections.map((s) => (
            <button
              key={s.id}
              role="tab"
              id={`tab-${s.id}`}
              aria-selected={active === s.id}
              aria-controls={`panel-${s.id}`}
              onClick={() => setActive(s.id)}
              className={cn(
                'border-b-2 px-4 py-3 font-sans text-small font-semibold transition-colors',
                active === s.id
                  ? 'border-oriel-orange text-oriel-navy'
                  : 'border-transparent text-oriel-slate hover:text-oriel-navy'
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
        {sections.map((s) => (
          <div
            key={s.id}
            role="tabpanel"
            id={`panel-${s.id}`}
            aria-labelledby={`tab-${s.id}`}
            hidden={active !== s.id}
            className="py-6"
          >
            {s.content}
          </div>
        ))}
      </div>

      {/* Mobile accordion */}
      <div className="divide-y divide-oriel-line border-y border-oriel-line md:hidden">
        {sections.map((s) => {
          const open = openIds.has(s.id);
          return (
            <div key={s.id}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`acc-${s.id}`}
                onClick={() => toggle(s.id)}
                className="flex w-full items-center justify-between py-4 text-left font-display text-[0.9375rem] font-semibold text-oriel-navy"
              >
                {s.title}
                <ChevronDown
                  size={18}
                  strokeWidth={1.5}
                  className={cn('transition-transform duration-200', open && 'rotate-180')}
                  aria-hidden
                />
              </button>
              <div id={`acc-${s.id}`} hidden={!open} className="pb-5">
                {s.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
