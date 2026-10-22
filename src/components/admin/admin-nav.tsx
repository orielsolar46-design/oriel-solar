'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Boxes,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Package,
  Receipt,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import { DeliveryIcon } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { APP_VERSION } from '@/lib/version';
import { cn } from '@/lib/utils';

// Orders takes the brand lorry rather than lucide's, in its `mono` tone so it
// still inherits the active/inactive colour the rest of the rail runs on. That
// is why each entry renders its own icon instead of sharing one call signature:
// the brand marks and the lucide set do not take the same props.
// `short` is the label the mobile bottom bar uses. Five columns on a 360px
// phone leave roughly 65px each, and the bar sets its labels in 10px uppercase
// with 0.12em tracking. `group` is the heading the desktop rail files each link
// under; it is the only ordering information on the page.
type AdminLink = {
  href: string;
  label: string;
  short?: string;
  group: string;
  icon: (size: number) => React.ReactNode;
  exact?: boolean;
  chats?: boolean;
};

export const ADMIN_LINKS: AdminLink[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    short: 'Home',
    group: 'Overview',
    icon: (s: number) => <LayoutDashboard size={s} strokeWidth={1.5} />,
    exact: true,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    group: 'Sales',
    icon: (s: number) => <DeliveryIcon size={s} tone="mono" />,
  },
  {
    href: '/admin/chats',
    label: 'Chats',
    group: 'Sales',
    icon: (s: number) => <MessageCircle size={s} strokeWidth={1.5} />,
    chats: true,
  },
  {
    href: '/admin/inbox',
    label: 'Inbox',
    group: 'Sales',
    icon: (s: number) => <Inbox size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/products',
    label: 'Products',
    short: 'Items',
    group: 'Catalogue',
    icon: (s: number) => <Package size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/inventory',
    label: 'Stock',
    group: 'Catalogue',
    icon: (s: number) => <Boxes size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/quotes',
    label: 'Quotes',
    group: 'Money',
    icon: (s: number) => <FileText size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/invoices',
    label: 'Invoices',
    // "Invoices" is eleven characters of 10px uppercase with 0.12em tracking
    // and does not survive a 45px column; "Docs" does, and covers receipts
    // too, which are the larger half of what lives in there.
    short: 'Docs',
    group: 'Money',
    icon: (s: number) => <Receipt size={s} strokeWidth={1.5} />,
  },
  {
    href: '/admin/payments',
    label: 'Payments',
    short: 'Pay',
    group: 'Money',
    icon: (s: number) => <Wallet size={s} strokeWidth={1.5} />,
  },
];

const RAIL_GROUPS = Array.from(new Set(ADMIN_LINKS.map((link) => link.group)));

// The four places staff actually stand in front of a customer, plus More.
const MOBILE_LINKS = ['/admin', '/admin/orders', '/admin/chats', '/admin/inventory'].map(
  (href) => ADMIN_LINKS.find((link) => link.href === href)!
);

/**
 * Admin navigation.
 *
 * Desktop is the deep-navy rail from the reference: one dark, quiet surface
 * holding grouped destinations, a white logo, and the active item marked by an
 * orange icon tile rather than a second colour of text. The storefront's header
 * does not appear on these routes, so the rail is also the "you are in the back
 * office" signal.
 *
 * Mobile keeps the bottom bar, now five columns instead of nine. Nine labels
 * on a 360px phone were being read at 10px; five read at a glance, and the
 * rest live behind More, which opens a sheet in the same thumb zone. The chat
 * badge is the only number on the bar: a visitor waiting is the one thing that
 * cannot wait for a page refresh.
 */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = React.useState(0);
  const [moreOpen, setMoreOpen] = React.useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  /**
   * Task screens — quick edit, set stock, send a prompt, answer a chat — drop
   * the mobile bar. Each of them pins its own commit or send button to the
   * bottom of the screen, and two stacked bars in the thumb zone means the
   * important one is the one you cannot reach. The desktop rail stays.
   */
  const isTaskScreen =
    /^\/admin\/products\/[^/]+\/(edit|stock)$/.test(pathname) ||
    /^\/admin\/orders\/[^/]+\/prompt$/.test(pathname) ||
    /^\/admin\/invoices\/(new|[^/]+\/edit)$/.test(pathname) ||
    /^\/admin\/chats\/[^/]+$/.test(pathname);

  React.useEffect(() => {
    if (pathname === '/admin/login') return;
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/admin/chats?count=1', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { unread?: number };
        if (!cancelled) setUnread(typeof data.unread === 'number' ? data.unread : 0);
      } catch {
        /* the badge is a convenience; a failed poll leaves the last count */
      }
    };

    load();
    const timer = window.setInterval(load, 60000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') load();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [pathname]);

  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  if (pathname === '/admin/login') return null;

  const hiddenMobileActive = !MOBILE_LINKS.some((link) => isActive(link.href, link.exact));

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-gradient-to-b from-oriel-navy-deep via-oriel-navy-deep to-[#0A2455] text-oriel-white lg:flex">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-oriel-white/95 p-0.5 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.55)]">
            <Image
              src="/brand/oriel-logo-circle.jpg"
              alt=""
              width={40}
              height={40}
              priority
              className="h-full w-full rounded-[9px] object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-headline text-[0.9375rem] font-semibold leading-tight text-oriel-white">
              Oriel Solar
            </span>
            <span className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em] text-oriel-white/45">
              Back office
              {/* Which build the owner is looking at. It matters when he rings
                  to say something is wrong and the answer depends on whether
                  his home-screen copy has updated yet. */}
              <span className="rounded-pill bg-oriel-white/10 px-1.5 font-mono normal-case tracking-normal text-oriel-white/70">
                v{APP_VERSION}
              </span>
            </span>
          </span>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]"
        >
          {RAIL_GROUPS.map((group) => (
            <div key={group} className="pt-4 first:pt-1">
              <p className="px-3 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-oriel-white/35">
                {group}
              </p>
              <ul className="space-y-1">
                {ADMIN_LINKS.filter((link) => link.group === group).map((link) => {
                  const active = isActive(link.href, link.exact);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group flex h-11 items-center gap-3 rounded-[10px] px-2 text-small font-medium transition-colors duration-200',
                          active
                            ? 'bg-oriel-white/[0.09] text-oriel-white ring-1 ring-inset ring-oriel-white/10'
                            : 'text-oriel-white/65 hover:bg-oriel-white/[0.05] hover:text-oriel-white'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-colors',
                            active
                              ? 'bg-oriel-orange text-oriel-white shadow-[0_4px_10px_-4px_rgba(242,106,33,0.6)]'
                              : 'bg-oriel-white/[0.06] text-oriel-white/70 group-hover:text-oriel-white'
                          )}
                        >
                          {link.icon(17)}
                        </span>
                        <span className="flex-1 truncate">{link.label}</span>
                        {link.chats && unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-oriel-orange px-1.5 font-mono text-[0.625rem] font-semibold text-oriel-white">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-oriel-white/10 p-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-3 rounded-[10px] px-3 text-small font-medium text-oriel-white/55 transition-colors hover:bg-oriel-white/[0.05] hover:text-oriel-white"
          >
            <Store size={17} strokeWidth={1.5} className="shrink-0" />
            View the storefront
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="mt-1 flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-small font-medium text-oriel-white/55 transition-colors hover:bg-oriel-orange/15 hover:text-oriel-white"
          >
            <LogOut size={17} strokeWidth={1.5} className="shrink-0" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar — thumb-reachable, for use at a customer's gate */}
      <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
        <nav
          aria-label="Admin sections"
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 border-t border-oriel-line bg-oriel-white pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(10,23,51,0.35)] lg:hidden',
            isTaskScreen ? 'hidden' : 'grid grid-cols-5'
          )}
        >
          {MOBILE_LINKS.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-colors',
                  active ? 'text-oriel-navy' : 'text-oriel-slate'
                )}
              >
                {active && (
                  <span
                    className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-b-sm bg-oriel-orange"
                    aria-hidden
                  />
                )}
                <span className="relative">
                  {link.icon(20)}
                  {link.chats && unread > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1 h-2 w-2 rounded-pill bg-oriel-orange ring-2 ring-oriel-white"
                      aria-hidden
                    />
                  )}
                </span>
                {link.short ?? link.label}
              </Link>
            );
          })}

          <Dialog.Trigger asChild>
            <button
              type="button"
              className={cn(
                'relative flex h-16 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium uppercase tracking-[0.12em] transition-colors',
                hiddenMobileActive ? 'text-oriel-navy' : 'text-oriel-slate'
              )}
            >
              {hiddenMobileActive && (
                <span
                  className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-b-sm bg-oriel-orange"
                  aria-hidden
                />
              )}
              <MoreHorizontal size={20} strokeWidth={1.5} />
              More
            </button>
          </Dialog.Trigger>
        </nav>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-oriel-navy-ink/50 data-[state=open]:animate-oriel-fade lg:hidden" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-panel bg-oriel-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-oriel-lift focus:outline-none data-[state=open]:animate-oriel-fade lg:hidden">
            <span
              className="mx-auto mb-4 block h-1 w-10 rounded-pill bg-oriel-line"
              aria-hidden
            />
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-headline text-h3 font-semibold text-oriel-navy">
                More
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-input text-oriel-slate transition-colors hover:bg-oriel-mist hover:text-oriel-navy"
                  aria-label="Close menu"
                >
                  <X size={19} strokeWidth={1.5} />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">
              Every back-office section, the storefront and sign out.
            </Dialog.Description>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {ADMIN_LINKS.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-panel border px-2 py-3 text-center text-[0.6875rem] font-medium transition-colors',
                      active
                        ? 'border-oriel-navy bg-oriel-mist text-oriel-navy'
                        : 'border-oriel-line bg-oriel-white text-oriel-slate hover:border-oriel-navy/30 hover:text-oriel-navy'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-[10px]',
                        active ? 'bg-oriel-navy text-oriel-white' : 'bg-oriel-mist text-oriel-navy'
                      )}
                    >
                      {link.icon(18)}
                    </span>
                    <span className="flex items-center gap-1">
                      {link.label}
                      {link.chats && unread > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-oriel-orange px-1 font-mono text-[0.5625rem] font-semibold text-oriel-white">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 space-y-2 border-t border-oriel-line pt-4">
              <Button asChild variant="outline" className="h-11 w-full">
                <Link href="/" onClick={() => setMoreOpen(false)}>
                  <Store size={17} strokeWidth={1.5} /> View the storefront
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-full justify-start text-oriel-orange-deep hover:bg-oriel-orange-soft"
                onClick={signOut}
              >
                <LogOut size={17} strokeWidth={1.5} /> Sign out
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
