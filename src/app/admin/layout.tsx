import type { Metadata, Viewport } from 'next';
import { AdminNav } from '@/components/admin/admin-nav';
import { AdminTopBar } from '@/components/admin/admin-topbar';
import { fontHeadline } from '@/lib/fonts';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Oriel Admin' },
  robots: { index: false, follow: false },
  // Installable only from /admin — the shopfront stays a website. Scope and
  // start_url in the manifest agree, so launching the icon lands on the
  // dashboard rather than the shop.
  manifest: '/manifest.webmanifest',
  applicationName: 'Oriel Back Office',
  appleWebApp: {
    capable: true,
    title: 'Oriel Admin',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/app/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/app/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/app/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B2A6B',
  width: 'device-width',
  initialScale: 1,
  // The gate screens get used one-handed in sunlight; pinch-zoom stays
  // available because taking that away from an older user is hostile.
  maximumScale: 5,
};

/**
 * Admin shell.
 *
 * A fixed light rail on desktop, offset by `lg:pl-64`; on phones the rail
 * becomes a bottom bar and the padding moves to the bottom so the last row of
 * a list is never trapped under it. Mobile-first is not decoration here — this
 * dashboard gets used standing at a customer's gate.
 *
 * The storefront's header and footer are gated out of `/admin` in the root
 * layout, so this shell is the only chrome on the page.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fontHeadline.variable} min-h-screen bg-oriel-mist`}>
      <AdminNav />
      <div className="pb-safe lg:pb-0 lg:pl-64">
        <AdminTopBar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
