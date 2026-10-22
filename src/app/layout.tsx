import type { Metadata } from 'next';
import { fontDisplay, fontBody, fontData } from '@/lib/fonts';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartProvider } from '@/components/cart/cart-provider';
import { SiteChrome } from '@/components/layout/site-chrome';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { ChatWidget } from '@/components/chat/chat-widget';
import { CONTACT } from '@/lib/navigation';
import { SITE_URL as siteUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // The trading name leads in every search-facing surface: it is the name the
  // client wants recognised, and it carries the word buyers actually type.
  // The registered name stays on the legal pages, invoices and order
  // notifications, where it is the company that must be named.
  title: {
    default: 'Oriel Solar — Solar panels, batteries & inverters in Kenya',
    template: '%s · Oriel Solar',
  },
  description:
    'Tier 1 solar panels, lithium storage and inverters — supplied, sized and installed across Kenya. Clean energy, more savings, brighter tomorrow.',
  applicationName: 'Oriel Solar',
  // Canonical URLs resolve against metadataBase; per-page metadata overrides.
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Oriel Solar',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    // Let Google show full-length previews and large image thumbnails: the
    // product photography is the strongest signal we have in a shopping result.
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { telephone: true },
  // Search Console's HTML-tag verification. Absent until the token is supplied,
  // which is harmless — the DNS TXT method verifies the domain independently.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport = {
  themeColor: '#0B2A6B',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Organisation schema — real details only.
 *
 * There is no `streetAddress`: the premises address has not been supplied, and
 * an omitted field is valid structured data where a placeholder string is a
 * lie that Google would happily index.
 *
 * The registered name leads here and the trading name is the alternate,
 * because this node describes the legal company. The `WebSite` node on the
 * home page reverses that pair on purpose: it describes the site, which
 * trades as Oriel Solar.
 */
const organisationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${siteUrl}/#organization`,
  name: 'Oriel Power Ltd',
  alternateName: 'Oriel Solar',
  url: siteUrl,
  logo: `${siteUrl}/brand/oriel-logo.jpg`,
  description:
    'Supplier and installer of solar panels, lithium battery storage, inverters, solar water heaters, street lighting and solar pumping across Kenya. Verified EcoFlow and Bluetti distributor.',
  email: CONTACT.email,
  telephone: [CONTACT.phonePrimaryTel, CONTACT.phoneSecondaryTel],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
  areaServed: { '@type': 'Country', name: 'Kenya' },
  slogan: 'Clean energy, More Savings, Brighter Tomorrow',
  // The brands we are known for. A crawler reading this can tell what the
  // shop actually sells without reading a single product page.
  brand: [
    { '@type': 'Brand', name: 'EcoFlow' },
    { '@type': 'Brand', name: 'Bluetti' },
    { '@type': 'Brand', name: 'Vestwoods' },
    { '@type': 'Brand', name: 'Jinko Solar' },
    { '@type': 'Brand', name: 'Solis' },
    { '@type': 'Brand', name: 'Growatt' },
    { '@type': 'Brand', name: 'Deye' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: CONTACT.phonePrimaryTel,
    contactType: 'sales',
    areaServed: 'KE',
    availableLanguage: ['en', 'sw'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-KE"
      className={cn(fontDisplay.variable, fontBody.variable, fontData.variable)}
    >
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-input focus:bg-oriel-navy focus:px-4 focus:py-2 focus:text-oriel-white"
        >
          Skip to content
        </a>
        <CartProvider>
          <SiteChrome slot="header">
            <Header />
          </SiteChrome>
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteChrome slot="footer">
            <Footer />
          </SiteChrome>
        </CartProvider>
        <GoogleAnalytics />
        <ChatWidget />
      </body>
    </html>
  );
}
