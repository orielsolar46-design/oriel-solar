'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Store,
  Wallet,
} from 'lucide-react';
import { DeliveryIcon } from '@/components/ui/brand-icons';
import { APP_VERSION } from '@/lib/version';
import { cn } from '@/lib/utils';

// Orders takes the brand lorry rather than lucide's, in its `mono` tone so it
// still inherits the active/inactive colour the rest of the rail runs on. That
// is why each entry renders its own icon instead of sharing one call signature:
// the brand marks and the lucide set do not take the same props.
// `short` is the label the mobile bottom bar uses. Seven columns on a 360px
// phone leave roughly 50px each, and the bar sets its labels in 10px uppercase
// with 0.12em tracking — "Dashboard" does not survive that, "Home" does. The
// desktop rail has the room and keeps the full word.
export const ADMIN_LINKS = [
  {
    href: '/admin',
    label: 'Dashboard',
    short: 'Home',
    icon: (s: number) => <LayoutDashboard size={s} strokeWidth={1.5} />,
    exact: true,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: (s: number) => <DeliveryIcon size={s} tone="mono" />,
  },
  {
    href: '/admin/products',
    label: 'Products',
    short: 'Items',
    icon: (s: number) => <Package size={s} strokeWidth={1.5} />,
  },
  { href: '/admin/inventory', label: 'Stock', icon: (s: number) => <Boxes size={s} strokeWidth={1.5} /> },
  { href: '/admin/quotes', label: 'Quotes', icon: (s: number) => <FileText size={s} strokeWidth={1.5} /> },
  {
    href: '/admin/invoices',
    label: 'Invoices',
    // "Invoices" is eleven characters of 10px uppercase with 0.12em tracking
    // and does not survive a 45px column; "Docs" does, and covers receipts
    // too, which are the larger half of what lives in there.
    short: 'Docs',
    icon: (s: number) => <Receipt size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    short: 'Pay',
    icon: (s: number) => <Wallet size={s} strokeWidth={1.5} />,
  },
  { href: '/admin/inbox', label: 'Inbox', icon: (s: number) => <Inbox size={s} strokeWidth={1.5} /> },
];

/**
 * Admin navigation.
 *
 * Desktop is a light rail: white panel, mist page behind it, and the active
 * item carried by a filled navy pill with a chevron rather than by a dark
 * surface. Navy is the brand's structural colour and it is doing the work the
 * reference gives its own primary — one saturated shape on a quiet panel, so
 * the eye finds "where am I" before it reads a single word.
 *
 * This replaces the deep-navy rail. That rail separated back office from
 * storefront by making the whole chrome dark, which worked but spent the
 * darkest colour in the palette on furniture; the storefront's header no
 * longer appears on these routes at all, so the separation no longer needs
 * to be argued in paint.
 *
 * Mobile keeps the bottom bar it always had. That was a deliberate decision
 * and remains one: this dashboard gets used one-handed, standing at a
 * customer's gate, and the thumb does not reach the top of a phone.
 */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  /**
   * Task screens — quick edit, set stock, send a prompt — drop the mobile bar.
   * Each of them pins its own commit or send button to the bottom of the
   * screen, and two stacked bars in the thumb zone means the important one is
   * the one you cannot reach. The desktop rail stays: there is room for it.
   */
  const isTaskScreen =
    /^\/admin\/products\/[^/]+\/(edit|stock)$/.test(pathname) ||
    /^\/admin\/orders\/[^/]+\/prompt$/.test(pathname) ||
    /^\/admin\/invoices\/(new|[^/]+\/edit)$/.test(pathname);

  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  if (pathname === '/admin/login') return null;

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-oriel-line bg-oriel-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-oriel-line px-6 py-5">
          <Image
            src="/brand/oriel-logo-circle.jpg"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-pill object-cover"
          />
          <span className="min-w-0">
            <span className="block truncate font-headline text-[0.9375rem] font-semibold leading-tight text-oriel-navy">
              Oriel Solar
            </span>
            <span className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-oriel-slate">
              Back office
              {/* Which build the owner is looking at. It matters when he rings
                  to say something is wrong and the answer depends on whether
                  his home-screen copy has updated yet. */}
              <span className="rounded-pill bg-oriel-mist px-1.5 font-mono normal-case tracking-normal text-oriel-navy">
                v{APP_VERSION}
              </span>
            </span>
          </span>
        </div>

        <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {ADMIN_LINKS.map((link) => {
              const active = isActive(link.href, link.exact);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center gap-3 rounded-pill px-3 text-small font-medium transition-all duration-200 ease-oriel-out',
                      active
                        ? 'bg-oriel-navy text-oriel-white'
                        : 'text-oriel-slate hover:bg-oriel-mist/50 hover:text-oriel-navy'
                    )}
                  >
                    <span className="shrink-0">{link.icon(18)}</span>
                    <span className="flex-1 truncate">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-oriel-line p-3">
          <Link
            href="/"
            className="flex h-11 items-center gap-3 rounded-pill px-3 text-small font-medium text-oriel-slate transition-colors hover:bg-oriel-mist/50 hover:text-oriel-navy"
          >
            <Store size={17} strokeWidth={1.5} className="shrink-0" />
            View the storefront
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex h-11 w-full items-center gap-3 rounded-pill px-3 text-small font-medium text-oriel-slate transition-colors hover:bg-oriel-orange-soft hover:text-oriel-orange-deep"
          >
            <LogOut size={17} strokeWidth={1.5} className="shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar — thumb-reachable, for use at a customer's gate */}
      <nav
        aria-label="Admin sections"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 min-h-nav border-t border-oriel-line bg-oriel-white shadow-oriel-rest pb-[env(safe-area-inset-bottom)] lg:hidden',
          isTaskScreen ? 'hidden' : 'flex'
        )}
      >
        {ADMIN_LINKS.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-colors',
                active ? 'text-oriel-navy' : 'text-oriel-slate'
              )}
            >
              {active && (
                <span
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-b-sm bg-oriel-orange"
                  aria-hidden
                />
              )}
              {link.icon(20)}
              {link.short ?? link.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
