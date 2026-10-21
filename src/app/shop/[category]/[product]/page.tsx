import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, ShieldCheck, FileDown } from 'lucide-react';
import { DeliveryIcon, MpesaMark, WhatsAppIcon } from '@/components/ui/brand-icons';
import {
  getAllProducts,
  getProduct,
  getProductsBySlugs,
  filterProducts,
  type PublicProduct,
} from '@/lib/catalogue';
import { CATEGORY_CONTENT } from '@/lib/category-content';
import { CONTACT } from '@/lib/navigation';
import { SITE_URL } from '@/lib/site';
import { ContactBand } from '@/components/layout/contact-band';
import { BuyBox } from '@/components/shop/add-to-basket';
import { CompletesSystem } from '@/components/shop/completes-system';
import { Gallery } from '@/components/shop/gallery';
import { PriceBlock } from '@/components/shop/price-block';
import { ProductCard } from '@/components/shop/product-card';
import { SpecSections, type SpecSection } from '@/components/shop/spec-sections';

type Props = { params: { category: string; product: string } };

/**
 * Prerender every published product at build time and refresh hourly.
 * Without this each product page made a database round-trip on every request,
 * which put LCP over the 2.5s budget on a mid-range Android.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ category: p.category, product: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.product);
  if (!product) return {};
  const path = `/shop/${product.category}/${product.slug}`;
  return {
    title: `${product.name} — price in Kenya`,
    description: product.shortDescription,
    // Canonical on the product's own path: filter and tracking query strings
    // must never split its ranking across duplicate URLs.
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.shortDescription,
      url: path,
    },
  };
}

/**
 * Map our internal stock bookkeeping onto schema.org availability.
 *
 * Everything that was not in stock used to be published as `PreOrder`, which
 * states that a product has not been released yet. That is untrue of almost
 * the whole catalogue: `call_for_stock` means availability must be confirmed
 * with us, and `on_order` means stock is bought and in transit. Both are
 * ordinary supply states for equipment we import to order, and misdeclaring
 * them as unreleased is exactly the kind of mismatch that costs a shopping
 * listing its eligibility.
 */
function schemaAvailability(product: PublicProduct): string {
  if (product.outOfStock) return 'https://schema.org/OutOfStock';
  switch (product.stockStatus) {
    case 'in_stock':
    case 'low_stock':
      return 'https://schema.org/InStock';
    case 'on_order':
      return 'https://schema.org/BackOrder';
    default:
      return 'https://schema.org/LimitedAvailability';
  }
}

function specTable(product: PublicProduct) {
  const grouped = new Map<string, { label: string; value: string; unit: string }[]>();
  for (const spec of product.specs) {
    const list = grouped.get(spec.group) ?? [];
    list.push(spec);
    grouped.set(spec.group, list);
  }
  if (grouped.size === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full max-w-2xl border-collapse text-left">
        <caption className="sr-only">Full specification for {product.name}</caption>
        {Array.from(grouped.entries()).map(([group, rows]) => (
          <tbody key={group}>
            <tr>
              <th
                colSpan={2}
                scope="colgroup"
                className="border-b border-oriel-line bg-oriel-mist px-3 py-2 font-mono text-micro font-medium uppercase tracking-wider text-oriel-slate"
              >
                {group}
              </th>
            </tr>
            {rows.map((row) => (
              <tr key={`${group}-${row.label}`} className="border-b border-oriel-line">
                <th scope="row" className="w-1/2 px-3 py-2 text-small font-normal text-oriel-slate">
                  {row.label}
                </th>
                <td className="px-3 py-2 font-mono text-data text-oriel-navy-ink">
                  {row.value}
                  {row.unit ? ` ${row.unit}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.product);
  if (!product || product.category !== params.category) notFound();

  const categoryTitle =
    CATEGORY_CONTENT[product.category]?.title.split(' — ')[0] ?? product.category;
  const faqs = CATEGORY_CONTENT[product.category]?.faqs ?? [];
  const compatibles = await getProductsBySlugs(product.compatibleWith);
  const similar = (
    await filterProducts({ category: product.category, type: product.subcategory })
  )
    .filter((p) => p.slug !== product.slug)
    .slice(0, 3);

  const whatsappText = encodeURIComponent(
    `Hello Oriel Power — I'd like to talk to an engineer about the ${product.name}${product.modelCode ? ` (${product.modelCode})` : ''}.`
  );

  const sections: SpecSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      content: (
        <div className="max-w-2xl space-y-4 text-body text-oriel-navy-ink">
          {(product.longDescription ?? product.shortDescription)
            .split('\n\n')
            .map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
        </div>
      ),
    },
  ];
  const table = specTable(product);
  if (table) sections.push({ id: 'specification', title: 'Full specification', content: table });
  sections.push({
    id: 'compatibility',
    title: 'Installation & compatibility',
    content: (
      <div className="max-w-2xl space-y-3 text-body text-oriel-navy-ink">
        <p>
          {product.requiresInstallation
            ? 'This product requires professional installation. Add installation at checkout, or book a site survey and our engineers will confirm the design before anything is fitted.'
            : 'This item is a self-contained component and does not require professional installation on its own.'}
        </p>
        {compatibles.length > 0 && (
          <p>
            Verified pairings are listed under “Completes this system” below — they match this
            product&apos;s voltage class and connectors.
          </p>
        )}
        <p className="rounded-card bg-oriel-gold-soft p-4 text-small">
          Never mix battery and inverter voltage classes: a low-voltage (51.2V) battery cannot be
          connected to a high-voltage inverter input, and vice versa. If you are unsure, talk to an
          engineer before ordering — the check takes minutes and prevents damaged equipment.
        </p>
      </div>
    ),
  });
  sections.push({
    id: 'warranty',
    title: 'Warranty & returns',
    content: (
      <div className="max-w-2xl space-y-3 text-body text-oriel-navy-ink">
        <p>
          {product.warrantyYears != null ? (
            <>
              This product carries a{' '}
              <span className="font-mono font-medium">{product.warrantyYears}-year</span>{' '}
              manufacturer warranty.
            </>
          ) : (
            <>
              The warranty period for this product is confirmed before purchase — ask us
              and we will tell you the term and what it covers.
            </>
          )}
        </p>
        <p>
          Returns and warranty claims both start by contacting us with your order number.
          The full terms are on our delivery and returns page.
        </p>
      </div>
    ),
  });
  if (product.datasheetUrl) {
    sections.push({
      id: 'downloads',
      title: 'Downloads',
      content: (
        <a
          href={product.datasheetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-body font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-4 hover:text-oriel-orange"
        >
          <FileDown size={18} strokeWidth={1.5} /> Manufacturer datasheet (PDF)
        </a>
      ),
    });
  }

  const base = SITE_URL;
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${base}/shop` },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryTitle,
        item: `${base}/shop/${product.category}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `${base}/shop/${product.category}/${product.slug}`,
      },
    ],
  };

  const productUrl = `${base}/shop/${product.category}/${product.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand },
    sku: product.modelCode ?? product.slug,
    ...(product.modelCode && { mpn: product.modelCode }),
    // Absolute URLs. Google fetches these itself and a site-relative path
    // gives it nothing to resolve against, so every product photograph was
    // being dropped from the shopping result.
    image: product.images.map((i) => `${base}${i.url}`),
    description: product.shortDescription,
    category: categoryTitle,
    url: productUrl,
    ...(product.warrantyYears != null && {
      warranty: {
        '@type': 'WarrantyPromise',
        durationOfWarranty: {
          '@type': 'QuantitativeValue',
          value: product.warrantyYears,
          unitCode: 'ANN',
        },
      },
    }),
    // An offer is published only when the page itself shows a price. A
    // quote-only product deliberately hides its figure, and marking it up
    // anyway would both leak that figure and contradict the visible page.
    ...(product.retailPrice != null &&
      !product.quoteOnly && {
        offers: {
          '@type': 'Offer',
          url: productUrl,
          price: product.retailPrice,
          priceCurrency: 'KES',
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@type': 'Organization', name: 'Oriel Power Ltd' },
          availability: schemaAvailability(product),
        },
      }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="container-oriel py-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-caption text-oriel-slate">
            <li><Link href="/" className="hover:text-oriel-orange">Home</Link></li>
            <li aria-hidden><ChevronRight size={14} strokeWidth={1.5} /></li>
            <li><Link href="/shop" className="hover:text-oriel-orange">Shop</Link></li>
            <li aria-hidden><ChevronRight size={14} strokeWidth={1.5} /></li>
            <li>
              <Link href={`/shop/${product.category}`} className="hover:text-oriel-orange">
                {categoryTitle}
              </Link>
            </li>
            <li aria-hidden><ChevronRight size={14} strokeWidth={1.5} /></li>
            <li aria-current="page" className="max-w-[16rem] truncate font-medium text-oriel-navy">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Above the fold */}
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <Gallery images={product.images} name={product.name} outOfStock={product.outOfStock} />

          <div>
            <p className="t-eyebrow text-oriel-slate">{product.brand}</p>
            <h1 className="t-h2 mt-1 text-oriel-navy">{product.name}</h1>
            {product.modelCode && (
              <p className="mt-1 font-mono text-data text-oriel-slate">{product.modelCode}</p>
            )}

            <div className="mt-5">
              <PriceBlock
                retailPrice={product.retailPrice}
                quoteOnly={product.quoteOnly}
                pricePerWatt={product.pricePerWatt}
                slug={product.slug}
                size="pdp"
              />
            </div>

            {/* Stock states are no longer advertised here. Out of stock is
                carried by the buy box below; lead time is genuinely useful
                and stays. */}
            {product.leadTimeDays != null && !product.outOfStock && (
              <p className="mt-4 text-small text-oriel-slate">
                Lead time <span className="font-mono">{product.leadTimeDays} days</span>
              </p>
            )}

            <ul className="mt-4 flex flex-wrap gap-2">
              {product.keySpecs.map((spec) => (
                <li
                  key={spec}
                  className="rounded-pill bg-oriel-mist px-3 py-1 font-mono text-caption text-oriel-navy-ink"
                >
                  {spec}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <BuyBox
                product={{
                  slug: product.slug,
                  name: product.name,
                  modelCode: product.modelCode,
                  image: product.images[0]?.url ?? null,
                  priced: product.retailPrice != null,
                  quoteOnly: product.quoteOnly,
                  outOfStock: product.outOfStock,
                }}
                installation={product.requiresInstallation}
              />
            </div>

            {/* Trust row */}
            <ul className="mt-6 grid grid-cols-3 gap-3 border-t border-oriel-line pt-5 text-center">
              <li className="flex flex-col items-center gap-1.5 text-caption text-oriel-navy-ink">
                <ShieldCheck size={20} strokeWidth={1.5} className="text-oriel-navy" aria-hidden />
                {product.warrantyYears != null ? (
                  <>
                    <span className="font-mono font-medium">{product.warrantyYears}-year</span>{' '}
                    warranty
                  </>
                ) : (
                  'Manufacturer warranty'
                )}
              </li>
              <li className="flex flex-col items-center gap-1.5 text-caption text-oriel-navy-ink">
                <DeliveryIcon size={20} />
                Nationwide delivery
              </li>
              <li className="flex flex-col items-center gap-1.5 text-caption text-oriel-navy-ink">
                <MpesaMark height={17} />
                accepted
              </li>
            </ul>

            <a
              href={`${CONTACT.whatsapp}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-input border border-oriel-green-deep px-5 py-3 font-sans text-body font-semibold text-oriel-green-deep transition-colors hover:bg-oriel-green-soft"
            >
              <WhatsAppIcon size={18} />
              Talk to an engineer about this
            </a>
          </div>
        </div>

        {/* Below the fold */}
        <div className="mt-12">
          <SpecSections sections={sections} />
        </div>

        <CompletesSystem
          items={compatibles.slice(0, 4).map((c) => ({
            slug: c.slug,
            name: c.name,
            modelCode: c.modelCode,
            category: c.category,
            image: c.images[0]?.url ?? null,
            retailPrice: c.quoteOnly ? null : c.retailPrice,
          }))}
        />

        {similar.length > 0 && (
          <section aria-labelledby="similar-heading" className="border-t border-oriel-line py-10">
            <h2 id="similar-heading" className="t-h2 text-oriel-navy">
              Similar products
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {similar.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section aria-labelledby="pdp-faq-heading" className="border-t border-oriel-line py-10">
            <h2 id="pdp-faq-heading" className="t-h2 text-oriel-navy">
              Common questions
            </h2>
            <div className="mt-5 max-w-2xl divide-y divide-oriel-line border-y border-oriel-line">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between font-display text-[0.9375rem] font-semibold text-oriel-navy [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronRight
                      size={18}
                      strokeWidth={1.5}
                      className="shrink-0 transition-transform duration-200 group-open:rotate-90"
                      aria-hidden
                    />
                  </summary>
                  <p className="mt-3 text-body text-oriel-navy-ink">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>

      <ContactBand />
    </>
  );
}
