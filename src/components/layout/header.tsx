'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Lock } from 'lucide-react';
import { SearchOverlay } from '@/components/layout/search-overlay';
import { Logo } from '@/components/brand/logo';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { HEADER_NAV } from '@/lib/navigation';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const isCheckout = pathname.startsWith('/checkout');
  const [compressed, setCompressed] = useState(false);
  // The brand links live on the same /shop path and differ only by query, so
  // the active state needs the query string. Reading it in an effect keeps
  // useSearchParams out of the static header (which would force a Suspense
  // boundary on every page).
  const [search, setSearch] = useState('');

  useEffect(() => {
    const sync = () => setSearch(window.location.search);
    sync();
    // Brand links differ only by query, so a back/forward step between them
    // does not change pathname. popstate keeps the underline truthful.
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [pathname]);

  // Compress the sticky bar after 40px of scroll.
  useEffect(() => {
    const onScroll = () => setCompressed(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    const [path, query] = href.split('?');
    if (query) {
      if (pathname !== path) return false;
      const expected = new URLSearchParams(query).get('brand');
      return new URLSearchParams(search).get('brand') === expected;
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Checkout uses simplified chrome: logo and a secure-checkout line only,
  // with no navigation to lead the customer away (MASTERPLAN 7.6).
  if (isCheckout) {
    return (
      <header className="border-b border-oriel-line bg-oriel-white">
        <div className="container-oriel flex h-16 items-center justify-between">
          <Logo height={48} priority />
          <p className="flex items-center gap-2 text-small font-medium text-oriel-slate">
            <Lock size={16} strokeWidth={1.5} aria-hidden />
            Secure checkout
          </p>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40">
      {/* The main bar is the whole header. Compresses 76→64px with a shadow and
          a 2px green hairline after 40px of scroll (MASTERPLAN V2 5.1).

          There is no utility strip above it. Contact details and Track order
          live in the footer, on /contact, and in the mobile drawer. */}
      <div
        className={cn(
          'relative bg-oriel-white transition-shadow duration-200 ease-out',
          compressed
            ? 'border-b-2 border-oriel-green shadow-oriel-rest'
            : 'border-b border-oriel-line'
        )}
      >
        <div
          className={cn(
            'container-oriel flex items-center justify-between transition-[height] duration-200 ease-out',
            compressed ? 'h-16' : 'h-[76px]'
          )}
        >
          <Logo height={compressed ? 48 : 60} priority />

          {/* Desktop primary nav: five direct links. No dropdowns, no
              accordions — every item is one click from here. */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {HEADER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  const query = item.href.split('?')[1];
                  setSearch(query ? `?${query}` : '');
                }}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 px-2 py-2 font-sans text-[15px] font-medium transition-colors xl:px-3',
                  isActive(item.href)
                    ? 'border-oriel-orange text-oriel-navy'
                    : 'border-transparent text-oriel-navy hover:text-oriel-orange'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <SearchOverlay />
            <Link
              href="/request-a-quote"
              className="hidden whitespace-nowrap rounded-input border border-oriel-navy px-4 py-2 font-sans text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-navy hover:text-oriel-white xl:inline-flex"
            >
              Request a quote
            </Link>
            {/* The accessible name must CONTAIN the visible text (the count),
                or assistive tech and the visible label disagree. */}
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-input text-oriel-navy transition-colors hover:bg-oriel-mist"
              aria-label={`Basket: ${count} ${count === 1 ? 'item' : 'items'}`}
            >
              <ShoppingCart size={20} strokeWidth={1.5} aria-hidden />
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-oriel-orange px-1 font-mono text-[0.625rem] font-medium leading-none text-oriel-white"
              >
                {count}
              </span>
            </Link>
            <MobileDrawer />
          </div>
        </div>
      </div>
    </header>
  );
}
