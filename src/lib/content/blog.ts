import 'server-only';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parseMarkdown, readingMinutes, type Block } from '@/lib/content/markdown';

/**
 * Blog articles, stored as markdown in /content/blog so the client can edit
 * them with any text editor (see CONTENT_GUIDE.md). Frontmatter carries the
 * title, description, category and publication date.
 */

export type Post = {
  slug: string;
  title: string;
  description: string;
  category: string;
  published: string;
  readingMinutes: number;
  blocks: Block[];
};

export type PostSummary = Omit<Post, 'blocks'>;

const DIR = path.join(process.cwd(), 'content', 'blog');

function parseFrontmatter(source: string): { data: Record<string, string>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: source.slice(match[0].length) };
}

function load(): Post[] {
  let files: string[];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const source = readFileSync(path.join(DIR, file), 'utf-8');
      const { data, body } = parseFrontmatter(source);
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title ?? file,
        description: data.description ?? '',
        category: data.category ?? 'Guides',
        published: data.published ?? '',
        readingMinutes: readingMinutes(body),
        blocks: parseMarkdown(body),
      };
    })
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
}

let cache: Post[] | null = null;
function all(): Post[] {
  if (!cache) cache = load();
  return cache;
}

export function getPosts(): PostSummary[] {
  return all().map(({ blocks: _blocks, ...summary }) => summary);
}

export function getPost(slug: string): Post | undefined {
  return all().find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): PostSummary[] {
  const current = all().find((p) => p.slug === slug);
  if (!current) return [];
  const others = all().filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category === current.category);
  const rest = others.filter((p) => p.category !== current.category);
  return [...sameCategory, ...rest].slice(0, limit).map(({ blocks: _blocks, ...s }) => s);
}
