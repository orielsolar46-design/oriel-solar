'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ChevronDown, Lock } from 'lucide-react';
import { SearchOverlay } from '@/components/layout/search-overlay';
import { Logo } from '@/components/brand/logo';
import { MobileDrawer } from '@/components/layout/mobile-drawer';
import { CATEGORIES, MAIN_NAV, NAV_GROUPS } from '@/lib/navigation';
import { useCart } from '@/components/cart/cart-provider';
import { cn } from '@/lib/utils';

/** Each group resolved to its actual family records, in the order listed. */
const GROUPS = NAV_GROUPS.map((g) => ({
  label: g.label,
  families: g.slugs
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter((c): c is (typeof CATEGORIES)[number] => Boolean(c)),
}));

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const isCheckout = pathname.startsWith('/checkout');
  const [compressed, setCompressed] = useState(false);
  // Which family's dropdown is open, by slug. Null when none is.
  const [openFamily, setOpenFamily] = useState<string | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compress the sticky bar after 40px of scroll.
  useEffect(() => {
    const onScroll = () => setCompressed(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close any open dropdown on route change.
  useEffect(() => {
    setOpenFamily(null);
  }, [pathname]);

  // Hover intent: 120ms delay before opening on hover (MASTERPLAN 5.2).
  const scheduleOpen = (slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setOpenFamily(slug), 120);
  };
  const scheduleClose = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpenFamily(null), 120);
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

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
        onMouseLeave={scheduleClose}
      >
        <div
          className={cn(
            'container-oriel flex items-center justify-between transition-[height] duration-200 ease-out',
            compressed ? 'h-16' : 'h-[76px]'
          )}
        >
          <Logo height={compressed ? 48 : 60} priority />

          {/* Desktop primary nav. Every product family gets its own button,
              because that is what people arrive wanting — the marketing pages
              moved to the footer. Each button is a link to the family, and
              hovering reveals the types within it. Water Treatment is excluded
              until it has stock; a nav item leading to an empty shelf is worse
              than no nav item. */}
          <nav className="hidden items-center lg:flex" aria-label="Primary">
            <Link
              href="/"
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-2 py-2 font-sans text-[15px] font-medium transition-colors xl:px-3',
                pathname === '/'
                  ? 'border-oriel-orange text-oriel-navy'
                  : 'border-transparent text-oriel-navy hover:text-oriel-orange'
              )}
            >
              Home
            </Link>

            {GROUPS.map((group) => {
              const active = group.families.some((c) => pathname.startsWith(`/shop/${c.slug}`));
              const open = openFamily === group.label;
              return (
                <div
                  key={group.label}
                  className="relative"
                  onMouseEnter={() => scheduleOpen(group.label)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    type="button"
                    className={cn(
                      'flex shrink-0 items-center gap-1 whitespace-nowrap border-b-2 px-2 py-2 font-sans text-[15px] font-medium transition-colors xl:px-3',
                      active
                        ? 'border-oriel-orange text-oriel-navy'
                        : 'border-transparent text-oriel-navy hover:text-oriel-orange'
                    )}
                    aria-expanded={open}
                    aria-haspopup="true"
                    onClick={() => setOpenFamily(open ? null : group.label)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setOpenFamily(null);
                    }}
                  >
                    {group.label}
                    <ChevronDown
                      size={14}
                      strokeWidth={1.5}
                      aria-hidden
                      className={cn('transition-transform duration-200', open && 'rotate-180')}
                    />
                  </button>

                  {open && (
                    <div
                      className={cn(
                        'absolute left-0 top-full z-50 rounded-b-card border border-t-0 border-oriel-line bg-oriel-white p-4 shadow-oriel-lift',
                        group.families.length === 1
                          ? 'w-56'
                          : group.families.length === 2
                            ? 'w-[22rem]'
                            : 'w-[30rem]'
                      )}
                      onMouseEnter={() => {
                        if (closeTimer.current) clearTimeout(closeTimer.current);
                      }}
                      onMouseLeave={scheduleClose}
                    >
                      {/* Families as headings with their types beneath, so the
                          whole group is one glance rather than a second menu. */}
                      <div
                        className={cn(
                          'grid gap-x-4 gap-y-1',
                          group.families.length === 1
                            ? 'grid-cols-1'
                            : group.families.length === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-3'
                        )}
                      >
                        {group.families.map((cat) => (
                          <div key={cat.slug}>
                            <Link
                              href={`/shop/${cat.slug}`}
                              onClick={() => setOpenFamily(null)}
                              className="block py-1 font-display text-small font-semibold text-oriel-navy transition-colors hover:text-oriel-orange"
                            >
                              {cat.navLabel}
                            </Link>
                            <ul className="mt-0.5 space-y-0.5">
                              {cat.subcategories.slice(0, 4).map((sub) => (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    onClick={() => setOpenFamily(null)}
                                    className="block py-0.5 text-micro text-oriel-slate transition-colors hover:text-oriel-orange"
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <Link
                        href="/shop"
                        onClick={() => setOpenFamily(null)}
                        className="mt-3 flex items-center gap-1.5 border-t border-oriel-line pt-3 text-small font-semibold text-oriel-navy transition-colors hover:text-oriel-orange"
                      >
                        Browse the whole catalogue
                        <ChevronDown size={14} strokeWidth={2} className="-rotate-90" aria-hidden />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}

            {MAIN_NAV.filter((item) => item.href !== '/').map((item) => (
              <Link
                key={item.href}
                href={item.href}
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
