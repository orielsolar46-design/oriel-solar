import type { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/catalogue';
import { getPosts } from '@/lib/content/blog';
import { SOLUTIONS } from '@/lib/content/solutions';
import { PROJECTS } from '@/lib/content/projects';
import { CATEGORY_CONTENT } from '@/lib/category-content';
import { SITE_URL } from '@/lib/site';

/**
 * Dynamic sitemap covering every indexable page: static pages, the eight
 * product categories, every published product, the solutions, the guides and
 * any projects. Checkout, cart, order pages and the admin are deliberately
 * absent — they are noindex and of no value to a crawler.
 *
 * Only the guides carry a `lastModified`, because only they have a real
 * publication date. Every other entry used to stamp the moment the sitemap
 * regenerated, which — on an hourly revalidate — told Google all ~200 pages
 * changed every hour. Google ignores a lastmod it finds untrustworthy, so
 * an absent date is worth more than a fabricated one.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/solutions`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/services`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/projects`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/request-a-quote`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/warranty`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/track-order`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/legal/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/legal/delivery-returns`, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categories: MetadataRoute.Sitemap = Object.keys(CATEGORY_CONTENT).map((slug) => ({
    url: `${base}/shop/${slug}`,
   
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const solutions: MetadataRoute.Sitemap = SOLUTIONS.map((s) => ({
    url: `${base}/solutions/${s.slug}`,
   
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const posts: MetadataRoute.Sitemap = getPosts().map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.published ? new Date(p.published) : undefined,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  const projects: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${base}/projects/${p.slug}`,
   
    changeFrequency: 'yearly',
    priority: 0.5,
  }));

  let products: MetadataRoute.Sitemap = [];
  try {
    products = (await getAllProducts()).map((p) => ({
      url: `${base}/shop/${p.category}/${p.slug}`,
     
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // A catalogue read failure must not break the sitemap for every other page.
  }

  return [...staticPages, ...categories, ...solutions, ...products, ...posts, ...projects];
}
