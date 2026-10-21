import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PROJECTS, getProject } from '@/lib/content/projects';
import { PageHero } from '@/components/content/page-hero';
import { ContactBand } from '@/components/layout/contact-band';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProject(params.slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug);
  if (!project) notFound();

  return (
    <>
      <PageHero
        eyebrow={`${project.county} · ${project.systemSize}`}
        title={project.title}
        intro={project.summary}
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: project.title }]}
      />

      <div className="container-oriel py-12">
        <div className="max-w-2xl space-y-4">
          {project.body.map((paragraph) => (
            <p key={paragraph.slice(0, 30)} className="text-body-lg text-oriel-navy-ink">
              {paragraph}
            </p>
          ))}
        </div>

        {project.images.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {project.images.map((image) => (
              <div
                key={image.url}
                className="relative aspect-[4/3] overflow-hidden rounded-card bg-oriel-mist"
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ContactBand />
    </>
  );
}
