import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { getPosts } from '@/lib/content/blog';
import { PageHero } from '@/components/content/page-hero';
import { ContactBand } from '@/components/layout/contact-band';

export const metadata: Metadata = {
  title: 'Solar guides for Kenya — sizing, batteries, inverters and cost',
  description:
    'Practical, Kenya-specific guidance on sizing a system, choosing batteries and inverters, reading datasheets, and what solar really costs.',
};

export default function BlogIndex() {
  const posts = getPosts();

  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="Solar, explained properly"
        intro="Practical guidance written for Kenyan conditions — the arithmetic behind sizing, the real cost of batteries over ten years, and how to tell a designed quotation from a guessed one."
        breadcrumbs={[{ label: 'Guides' }]}
      />

      <div className="container-oriel py-12">
        {posts.length === 0 ? (
          <p className="text-body text-oriel-slate">Articles are being written.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col rounded-card border border-oriel-line bg-oriel-white p-6 shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
              >
                <p className="t-eyebrow text-oriel-slate">{post.category}</p>
                <h2 className="mt-2 font-display text-[1.125rem] font-semibold leading-snug text-oriel-navy transition-colors group-hover:text-oriel-orange">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mt-2 flex-1 text-small text-oriel-navy-ink">{post.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-micro text-oriel-slate">
                    <Clock size={13} strokeWidth={1.5} aria-hidden />
                    {post.readingMinutes} min read
                  </span>
                  <span className="flex items-center gap-1 text-small font-semibold text-oriel-navy">
                    Read
                    <ArrowRight
                      size={15}
                      strokeWidth={1.5}
                      className="text-oriel-orange transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ContactBand />
    </>
  );
}
