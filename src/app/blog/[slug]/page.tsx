import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronRight, Clock } from 'lucide-react';
import { getPost, getPosts, getRelatedPosts } from '@/lib/content/blog';
import { Prose } from '@/components/content/prose';
import { ContactBand } from '@/components/layout/contact-band';
import { Button } from '@/components/ui/button';

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.published,
      url: `/blog/${post.slug}`,
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const related = getRelatedPosts(post.slug);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.published,
    author: { '@type': 'Organization', name: 'Oriel Power Ltd' },
    publisher: { '@type': 'Organization', name: 'Oriel Power Ltd' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article>
        <header className="bg-oriel-mist">
          <div className="container-oriel py-10 lg:py-12">
            <nav aria-label="Breadcrumb" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1 text-caption text-oriel-slate">
                <li>
                  <Link href="/" className="hover:text-oriel-orange">
                    Home
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight size={14} strokeWidth={1.5} />
                </li>
                <li>
                  <Link href="/blog" className="hover:text-oriel-orange">
                    Guides
                  </Link>
                </li>
              </ol>
            </nav>
            <p className="t-eyebrow text-oriel-slate">{post.category}</p>
            <h1 className="t-h1 mt-2 max-w-3xl">{post.title}</h1>
            <p className="mt-4 max-w-2xl text-body-lg text-oriel-navy-ink">{post.description}</p>
            <p className="mt-4 flex items-center gap-4 font-mono text-caption text-oriel-slate">
              <span className="flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.5} aria-hidden />
                {post.readingMinutes} min read
              </span>
              {post.published && (
                <time dateTime={post.published}>
                  {new Date(post.published).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              )}
            </p>
          </div>
        </header>

        <div className="container-oriel py-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_280px] lg:items-start">
            <Prose blocks={post.blocks} />

            <aside className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-card bg-oriel-navy-deep p-5">
                <p className="t-eyebrow text-oriel-gold">Put this into practice</p>
                <p className="mt-2 text-body text-oriel-white/85">
                  Send us your figures and an engineer will run this arithmetic against your own
                  usage — and tell you what it actually needs.
                </p>
                <Button asChild className="mt-4 w-full">
                  <Link href="/request-a-quote">Request a quote</Link>
                </Button>
              </div>
              <div className="rounded-card bg-oriel-green-soft p-5">
                <p className="text-small text-oriel-navy-ink">
                  Prefer to ask a person? An engineer answers on WhatsApp before you spend
                  anything.
                </p>
                <Link
                  href="/contact"
                  className="mt-2 inline-flex items-center gap-1.5 text-small font-semibold text-oriel-green-deep hover:underline"
                >
                  Talk to us <ArrowRight size={15} strokeWidth={1.5} aria-hidden />
                </Link>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section aria-labelledby="related" className="mt-16 border-t border-oriel-line pt-10">
              <h2 id="related" className="t-h2">
                Keep reading
              </h2>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/blog/${item.slug}`}
                    className="group rounded-card border border-oriel-line bg-oriel-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
                  >
                    <p className="t-eyebrow text-oriel-slate">{item.category}</p>
                    <h3 className="mt-2 font-display text-[1rem] font-semibold leading-snug text-oriel-navy transition-colors group-hover:text-oriel-orange">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-mono text-micro text-oriel-slate">
                      {item.readingMinutes} min read
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      <ContactBand />
    </>
  );
}
