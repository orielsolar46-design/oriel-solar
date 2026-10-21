'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

/**
 * Header search overlay (Stage 3). Opens over the page, traps focus in the
 * input, closes on Escape, and submits to the server-rendered /search page.
 */
export function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
    else triggerRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-input text-oriel-navy transition-colors hover:bg-oriel-mist"
        aria-label="Search"
        aria-expanded={open}
      >
        <Search size={20} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          className="fixed inset-0 z-50 bg-oriel-navy-ink/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-24 w-[92vw] max-w-xl rounded-card bg-oriel-white p-4 shadow-oriel-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit} role="search" className="flex items-center gap-2">
              <Search size={20} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
              <label htmlFor="overlay-search" className="sr-only">
                Search products
              </label>
              <input
                ref={inputRef}
                id="overlay-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Inverter, battery, model code…"
                className="h-12 w-full border-0 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-input bg-oriel-orange px-4 font-sans text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input text-oriel-navy hover:bg-oriel-mist"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
