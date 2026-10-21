/**
 * Completed installations.
 *
 * DELIBERATELY EMPTY. The brief forbids inventing projects, client names,
 * photographs or statistics, so this list stays empty until the client
 * supplies real installations ({{PROJECT_PHOTOS_AND_DETAILS}}). Both the
 * projects page and the home page's "Recent installations" block check the
 * length and hide themselves rather than showing fabricated work.
 *
 * To publish a project, add an entry here (or, once Supabase is provisioned,
 * through the admin) with photographs saved under /public/projects/<slug>/.
 */

export type Project = {
  slug: string;
  title: string;
  county: string;
  systemSize: string;
  summary: string;
  /** Paragraphs of detail. */
  body: string[];
  images: { url: string; alt: string }[];
  completed: string;
};

export const PROJECTS: Project[] = [];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
