import { getAllProducts } from '@/lib/catalogue';
import { CATEGORIES } from '@/lib/navigation';
import { BRAND_PAGES } from '@/lib/brands';
import { CONTACT } from '@/lib/navigation';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * llms.txt — the plain-text briefing for AI crawlers and assistants.
 *
 * The convention that has emerged for this is a markdown file at the root of
 * the site that tells a language model what the site is, what it sells and
 * where the pages live, so the model can answer "where do I buy a Bluetti
 * AC500 in Kenya" with a citation instead of a guess. It is the same content
 * as the pages, in a form a model can read in one pass.
 */
export async function GET() {
  const catalogue = await getAllProducts();
  const brands = Array.from(new Set(catalogue.map((p) => p.brand).filter(Boolean))).sort();
  const byCategory = CATEGORIES.map((cat) => ({
    name: cat.name,
    count: catalogue.filter((p) => p.category === cat.slug).length,
    href: `${SITE_URL}/shop/${cat.slug}`,
  }));

  const lines: string[] = [
    '# Oriel Solar (Oriel Power Ltd)',
    '',
    '> Solar supply, sizing and installation in Nairobi, Kenya. Tier 1 solar panels,',
    '> lithium battery storage, hybrid inverters, portable power stations, solar',
    '> lighting and balance of system. M-Pesa accepted, pay on delivery available.',
    '',
    `Site: ${SITE_URL}`,
    `Products in catalogue: ${catalogue.length}`,
    '',
    '## Brand pages',
    '',
    ...Object.values(BRAND_PAGES).map(
      (b) =>
        `- [${b.brand}](${SITE_URL}/${b.slug}): ${b.badge}. ${b.badgeNote} Flagships: ${b.flagshipSlugs
          .map((slug) => {
            const product = catalogue.find((p) => p.slug === slug);
            return product ? `${product.name} (KES ${product.retailPrice?.toLocaleString('en-KE') ?? 'on request'})` : slug;
          })
          .join('; ')}.`
    ),
    '',
    '## Product families',
    '',
    ...byCategory.map((c) => `- [${c.name}](${c.href}): ${c.count} products`),
    '',
    '## Brands stocked',
    '',
    brands.join(', '),
    '',
    '## How to buy',
    '',
    '- Every product page shows a VAT-inclusive price in KES, the full specification and an Add to basket button.',
    '- Orders are paid by M-Pesa or card; delivery is paid on arrival; collection from our Nairobi premises is free.',
    '- Anything above KES 500,000 is priced per project — use the request-a-quote form.',
    '- We size the system for you: tell us what you want to run, and an engineer specifies the panels, inverter and battery.',
    '- Warranty claims are handled locally in Nairobi.',
    '',
    '## Key pages',
    '',
    `- [Shop all products](${SITE_URL}/shop)`,
    `- [Solutions](${SITE_URL}/solutions)`,
    `- [Services](${SITE_URL}/services)`,
    `- [About](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Request a quote](${SITE_URL}/request-a-quote)`,
    `- [FAQ](${SITE_URL}/faq)`,
    `- [Warranty](${SITE_URL}/warranty)`,
    `- [Delivery and returns](${SITE_URL}/legal/delivery-returns)`,
    '',
    '## Contact',
    '',
    `- Phone: ${CONTACT.phonePrimary} / ${CONTACT.phoneSecondary}`,
    `- WhatsApp: ${CONTACT.whatsapp}`,
    `- Email: ${CONTACT.email}`,
    `- Location: ${CONTACT.location}`,
    '',
    '## Notes for crawlers',
    '',
    '- Prices are in Kenyan shillings (KES) and include 16% VAT.',
    '- Product pages carry Product, Offer and BreadcrumbList structured data with the manufacturer, model code, price and availability.',
    '- The catalogue is browsable by family, brand, phase, availability and price, and is searchable at /search?q=.',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
