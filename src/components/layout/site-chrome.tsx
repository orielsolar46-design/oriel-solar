'use client';

import { usePathname } from 'next/navigation';

/**
 * Gate for the storefront's own header and footer.
 *
 * Two routes are not the shop and must not wear its chrome:
 *
 * - `/admin` is a different application that happens to share a deployment. It
 *   has its own rail, its own title bar and its own sign-out, so the shop's
 *   header stacked a second navigation on top of it and the footer put a
 *   customer-facing sitemap under a stock table. Both are hidden outright.
 * - `/checkout` keeps the header but drops the footer, which is the simplified
 *   chrome MASTERPLAN 7.6 asks for.
 *
 * This is a client component because the decision is per-route and the layout
 * that renders it is a server component; `usePathname` is the cheapest way to
 * ask without threading the route through every page.
 */
export function SiteChrome({
  slot,
  children,
}: {
  slot: 'header' | 'footer';
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;
  if (slot === 'footer' && pathname.startsWith('/checkout')) return null;

  return <>{children}</>;
}
