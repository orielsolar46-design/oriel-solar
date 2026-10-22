import type { Metadata } from 'next';
import { getAllProducts } from '@/lib/catalogue';
import { BRAND_PAGES } from '@/lib/brands';
import { BrandLanding } from '@/components/brand/brand-landing';

const config = BRAND_PAGES.bluetti;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `/${config.slug}` },
  openGraph: {
    type: 'website',
    title: config.metaTitle,
    description: config.metaDescription,
    url: `/${config.slug}`,
  },
  robots: { index: true, follow: true },
};

export const revalidate = 3600;

export default async function BluettiPage() {
  const catalogue = await getAllProducts();
  const brand = catalogue.filter((p) => p.brand.toLowerCase() === 'bluetti');
  const products = config.flagshipSlugs
    .map((slug) => brand.find((p) => p.slug === slug))
    .filter((p): p is (typeof brand)[number] => Boolean(p));

  return <BrandLanding config={config} products={products} allCount={brand.length} />;
}
