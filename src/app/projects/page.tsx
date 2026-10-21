import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { PROJECTS } from '@/lib/content/projects';
import { PageHero } from '@/components/content/page-hero';
import { ContactBand } from '@/components/layout/contact-band';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Completed solar installations in Kenya',
  description: 'A record of solar systems Oriel Solar has supplied and installed across Kenya.',
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow="Projects"
        title="Completed installations"
        intro="Systems we have supplied and installed across Kenya."
        breadcrumbs={[{ label: 'Projects' }]}
      />

      <div className="container-oriel py-12">
        {PROJECTS.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-card border border-oriel-line bg-oriel-mist p-8">
            <h2 className="t-h3">This page is being prepared</h2>
            <p className="mt-3 text-body text-oriel-navy-ink">
              We are gathering photographs of completed installations, with our customers&apos;
              permission — rather than showing stock photographs of someone else&apos;s work.
              Ask us and we can put you in touch with customers directly.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Ask about our work</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/solutions">See what we build</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className="group overflow-hidden rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest transition-all duration-200 hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift"
              >
                <div className="relative aspect-[4/3] bg-oriel-mist">
                  <Image
                    src={project.images[0]?.url ?? '/products/placeholder.svg'}
                    alt={project.images[0]?.alt ?? project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="t-eyebrow text-oriel-slate">
                    {project.county} · {project.systemSize}
                  </p>
                  <h2 className="t-h3 mt-1.5 transition-colors group-hover:text-oriel-orange">
                    {project.title}
                  </h2>
                  <p className="mt-2 text-small text-oriel-navy-ink">{project.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <ContactBand />
    </>
  );
}
