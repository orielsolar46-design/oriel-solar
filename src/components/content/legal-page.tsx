import { PageHero } from '@/components/content/page-hero';

export type LegalSection = { heading: string; paragraphs: string[]; list?: string[] };

/** Shared layout for the legal pages: readable measure, numbered sections. */
export function LegalPage({
  title,
  intro,
  updated,
  sections,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={title}
        intro={intro}
        breadcrumbs={[{ label: title }]}
      />
      <div className="container-oriel py-12">
        <p className="text-small text-oriel-slate">
          Last updated <span className="font-mono">{updated}</span>
        </p>
        <div className="mt-8 max-w-2xl space-y-9">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="t-h3">
                <span className="mr-2 font-mono text-oriel-slate">{i + 1}.</span>
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 30)} className="mt-3 text-body text-oriel-navy-ink">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-2.5 text-body text-oriel-navy-ink">
                      <span
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
