/**
 * The public origin of the site — the single source of truth for canonicals,
 * JSON-LD, the sitemap, robots.txt and every absolute link in an email or SMS.
 *
 * This exists because each of those callers used to inline
 * `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'`. The variable
 * was never set on the production project, so the live site served
 * `http://localhost:3000` as its canonical on every page and in all 196
 * sitemap entries — a crawler following that finds nothing, and the whole
 * catalogue stays unindexable. Falling back to the real deployment host
 * instead means the worst case is an unbranded URL rather than a dead one.
 */

function resolveOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit;

  // Vercel injects these on every deployment; the production one is stable
  // across redeploys, unlike the per-deployment VERCEL_URL.
  const vercelProduction =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction}`;

  return 'http://localhost:3000';
}

/** Absolute origin, never with a trailing slash. */
export const SITE_URL = resolveOrigin().replace(/\/+$/, '');

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
