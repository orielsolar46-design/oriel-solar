import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/** Shared page header: breadcrumb, eyebrow, title, standfirst. */
export function PageHero({
  eyebrow,
  title,
  intro,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <section className="bg-oriel-mist">
      <div className="container-oriel py-10 lg:py-12">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-oriel-slate">
              <li>
                <Link href="/" className="hover:text-oriel-orange">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb) => (
                <li key={crumb.label} className="flex items-center gap-1">
                  <ChevronRight size={14} strokeWidth={1.5} aria-hidden />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-oriel-orange">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-oriel-navy" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="t-eyebrow text-oriel-slate">{eyebrow}</p>}
        <h1 className="t-h1 mt-2 max-w-3xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-body-lg text-oriel-navy-ink">{intro}</p>}
      </div>
    </section>
  );
}
