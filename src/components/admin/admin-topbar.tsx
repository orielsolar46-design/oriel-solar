'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Search } from 'lucide-react';

/**
 * The bar across the top of every admin screen.
 *
 * The reference puts a search field beside the page title, and this one is
 * real: it submits to `/admin/products`, which already reads `?q=` and matches
 * on name, brand and model code. A box that looked like search but did nothing
 * would be worse than no box at all.
 *
 * It also carries sign-out on phones. The rail is a bottom bar at that width
 * and has no room for it, so this is the only place it can live.
 */
export function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  if (pathname === '/admin/login') return null;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-oriel-line bg-oriel-white/95 px-4 py-3 backdrop-blur lg:px-10">
      {/* The rail carries the brand on desktop; on a phone it lives here. */}
      <span className="flex items-center gap-2.5 lg:hidden">
        <Image
          src="/brand/oriel-logo-circle.jpg"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-pill object-cover"
        />
        <span className="font-headline text-small font-semibold text-oriel-navy">Back office</span>
      </span>

      {/* min-w-0 so the field shrinks rather than shoving sign-out off a
          360px phone; max-w-sm so it does not sprawl on a desktop. */}
      <form action="/admin/products" method="get" className="relative min-w-0 flex-1 sm:max-w-sm">
        <label htmlFor="admin-search" className="sr-only">
          Search products
        </label>
        <Search
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-oriel-slate"
        />
        <input
          id="admin-search"
          type="search"
          name="q"
          placeholder="Search products"
          className="h-9 w-full rounded-pill border border-oriel-line bg-oriel-mist pl-10 pr-4 text-small text-oriel-navy-ink placeholder:text-oriel-slate transition-all focus:border-oriel-navy focus:bg-oriel-white focus:outline-none focus:ring-2 focus:ring-oriel-orange-soft"
        />
      </form>

      <button
        type="button"
        onClick={signOut}
        className="ml-auto flex h-9 shrink-0 items-center gap-2 rounded-pill border border-oriel-line px-4 text-micro font-medium text-oriel-navy transition-colors hover:bg-oriel-mist hover:text-oriel-orange"
      >
        <LogOut size={16} strokeWidth={1.5} aria-hidden />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </header>
  );
}
