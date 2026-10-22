import type { Metadata } from 'next';
import { Hero } from '@/components/home/hero';
import {
  BluettiShowcase,
  BrandsRow,
  CategoryGrid,
  EcoFlowShowcase,
  GreenBand,
  HowBuyingWorks,
  TrustStrip,
  VestwoodsShowcase,
} from '@/components/home/sections';
import { ContactBand } from '@/components/layout/contact-band';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Oriel Solar — Solar panels, batteries & inverters in Kenya',
  description:
    'Tier 1 solar panels, LiFePO4 batteries and hybrid inverters — supplied, sized and installed across Kenya. M-Pesa payment, pay on delivery available.',
};

/**
 * The home page: a visual hero, the catalogue, a short trust strip, the three
 * featured brands, one savings call to action, the buying steps and contact.
 * Statically rendered and refreshed hourly so the first paint never waits on a
 * database round-trip.
 */
export const revalidate = 3600;

/**
 * Site name for search results.
 *
 * Google reads `WebSite` to decide the name it prints above the URL in a
 * result, and its guidance is that this belongs on the home page — which is
 * why it lives here and not in the root layout. The trading name leads and
 * the registered name is the alternate, the mirror image of the
 * `Organization` node in the layout, where the legal entity must lead.
 *
 * The `potentialAction` is the site's own search box, declared to Google so
 * the result can carry a search field. The search endpoint is the one a
 * person can reach from the header on every page.
 */
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'Oriel Solar',
  alternateName: 'Oriel Power Ltd',
  url: SITE_URL,
  inLanguage: 'en-KE',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <Hero />

      <CategoryGrid />
      <TrustStrip />

      <BluettiShowcase />
      <EcoFlowShowcase />
      <VestwoodsShowcase />

      <GreenBand />
      <HowBuyingWorks />
      <BrandsRow />

      <ContactBand />
    </>
  );
}
