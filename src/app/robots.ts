import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Crawler rules.
 *
 * The admin, checkout, cart and token-guarded order pages are disallowed:
 * they carry no search value and the order pages contain customer data
 * behind a token that must never end up in an index.
 *
 * The AI crawlers are named explicitly and allowed. A bare `*` allow already
 * covers them, but naming them is the difference between a crawler that
 * reads the catalogue and one that skips it: OpenAI, Anthropic, Perplexity,
 * Google and the Apple crawler each look for their own token, and a rule
 * written for them is a rule they will honour. Being quotable by an
 * assistant is worth as much to this business as being ranked by Google.
 */
export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL;
  const disallowed = ['/admin', '/admin/', '/checkout', '/cart', '/order/', '/api/'];

  const aiCrawlers = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'anthropic-ai',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
    'Amazonbot',
    'meta-externalagent',
    'cohere-ai',
    'YouBot',
    'Diffbot',
    'MistralAI-User',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowed,
      },
      // Each AI crawler gets its own allow so there is no doubt, and so that
      // turning one of them off later does not touch the others.
      ...aiCrawlers.map((agent) => ({
        userAgent: agent,
        allow: '/',
        disallow: disallowed,
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
