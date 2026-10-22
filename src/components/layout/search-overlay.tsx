'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Suggestion = {
  slug: string;
  name: string;
  brand: string;
  price: number | null;
  image: string | null;
  href: string;
  matchedIn: string | null;
};

type FamilySuggestion = {
  name: string;
  descriptor: string;
  kind: 'category' | 'subcategory';
  href: string;
};

type SearchResponse = {
  total: number;
  products: Suggestion[];
  categories: FamilySuggestion[];
};

/**
 * Header search overlay (Stage 3). Opens over the page, traps focus in the
 * input, closes on Escape and submits to the server-rendered /search page.
 *
 * It also answers while you type: every keystroke asks the catalogue what
 * it has, and the answers come back as suggestions — a product with its price
 * and picture, or the family it belongs to. Typo-tolerant, because people
 * type "invrter" and expect to be understood.
 */
export function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [result, setResult] = React.useState<SearchResponse>({
    total: 0,
    products: [],
    categories: [],
  });
  const [active, setActive] = React.useState(0);
  const [picked, setPicked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
    else triggerRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResult({ total: 0, products: [], categories: [] });
      setActive(0);
    }
  }, [open]);

  // Ask the catalogue while the shopper types, but not on every keystroke.
  React.useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResult({ total: 0, products: [], categories: [] });
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as SearchResponse;
        setResult(data);
        setActive(0);
        setPicked(false);
      } catch {
        // A failed suggestion lookup must never break typing.
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const options: { href: string; label: string }[] = [
    ...result.categories.map((c) => ({ href: c.href, label: c.name })),
    ...result.products.map((p) => ({ href: p.href, label: p.name })),
  ];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    const chosen = picked ? options[active] : undefined;
    setOpen(false);
    if (chosen) {
      router.push(chosen.href);
      return;
    }
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setPicked(true);
      setActive((i) => (options.length ? (i + 1) % options.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setPicked(true);
      setActive((i) => (options.length ? (i - 1 + options.length) % options.length : 0));
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
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
            className="mx-auto mt-16 w-[94vw] max-w-2xl overflow-hidden rounded-card bg-oriel-white shadow-oriel-lift focus:outline-none sm:mt-24"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit} role="search" className="flex items-center gap-2 border-b border-oriel-line px-3">
              <Search size={18} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
              <label htmlFor="overlay-search" className="sr-only">
                Search products
              </label>
              <input
                ref={inputRef}
                id="overlay-search"
                type="search"
                role="combobox"
                aria-expanded={options.length > 0}
                aria-controls="overlay-search-results"
                aria-autocomplete="list"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Inverter, battery, model code, or “flood light”…"
                className="h-14 w-full border-0 text-body text-oriel-navy-ink placeholder:text-oriel-slate focus:outline-none"
              />
              <Button type="submit" size="sm" className="hidden h-10 shrink-0 sm:inline-flex">
                Search
              </Button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input text-oriel-navy hover:bg-oriel-mist"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </form>

            {query.trim().length >= 2 && (
              <div
                id="overlay-search-results"
                role="listbox"
                aria-label="Search suggestions"
                className="max-h-[52vh] overflow-y-auto"
              >
                {result.categories.length > 0 && (
                  <div className="border-b border-oriel-line py-2">
                    <p className="px-4 pb-1 text-eyebrow text-oriel-slate">Families</p>
                    {result.categories.map((c) => {
                      const index = result.categories.indexOf(c);
                      return (
                        <button
                          key={c.href}
                          type="button"
                          role="option"
                          aria-selected={active === index}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => {
                            setOpen(false);
                            router.push(c.href);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors ${
                            active === index ? 'bg-oriel-mist' : 'hover:bg-oriel-mist'
                          }`}
                        >
                          <span>
                            <span className="block text-small font-semibold text-oriel-navy">
                              {c.name}
                            </span>
                            <span className="block text-micro text-oriel-slate">{c.descriptor}</span>
                          </span>
                          <span className="shrink-0 text-eyebrow uppercase text-oriel-slate">Family</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {result.products.length > 0 && (
                  <div className="py-2">
                    <p className="px-4 pb-1 text-eyebrow text-oriel-slate">Products</p>
                    {result.products.map((p, i) => {
                      const index = result.categories.length + i;
                      return (
                        <button
                          key={p.slug}
                          type="button"
                          role="option"
                          aria-selected={active === index}
                          onMouseEnter={() => setActive(index)}
                          onClick={() => {
                            setOpen(false);
                            router.push(p.href);
                          }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                            active === index ? 'bg-oriel-mist' : 'hover:bg-oriel-mist'
                          }`}
                        >
                          {p.image ? (
                            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-input bg-oriel-mist">
                              <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-1" />
                            </span>
                          ) : (
                            <span className="h-11 w-11 shrink-0 rounded-input bg-oriel-mist" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-small font-semibold text-oriel-navy">
                              {p.name}
                            </span>
                            <span className="block truncate text-micro text-oriel-slate">
                              {p.brand}
                              {p.matchedIn ? ` · matched in ${p.matchedIn}` : ''}
                            </span>
                          </span>
                          {p.price != null && (
                            <span className="shrink-0 font-mono text-small text-oriel-navy-ink">
                              KES {p.price.toLocaleString('en-KE')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {query.trim().length >= 2 && !loading && result.products.length === 0 && result.categories.length === 0 && (
                  <p className="px-4 py-5 text-small text-oriel-slate">
                    Nothing matches &ldquo;{query.trim()}&rdquo; yet — press Enter to see every
                    result, or ask us on WhatsApp and we will source it.
                  </p>
                )}

                {loading && result.products.length === 0 && (
                  <p className="px-4 py-5 text-small text-oriel-slate">Searching…</p>
                )}
              </div>
            )}

            {query.trim().length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                className="flex w-full items-center justify-between gap-3 border-t border-oriel-line bg-oriel-mist px-4 py-3 text-left text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-line"
              >
                <span>
                  See all results for &ldquo;{query.trim()}&rdquo;
                  {result.total > 0 && (
                    <span className="ml-2 font-mono text-oriel-slate">({result.total})</span>
                  )}
                </span>
                <CornerDownLeft size={16} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
