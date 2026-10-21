/**
 * A small markdown renderer covering exactly what the articles use: headings,
 * paragraphs, lists, bold, italic, inline code, links and blockquotes.
 *
 * Written rather than pulled in as a dependency because the subset is small,
 * the content is ours (so no untrusted HTML), and the brief caps dependency
 * weight. Returns React-ready blocks rather than an HTML string, so nothing
 * is ever dangerously set.
 */

export type Inline =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'em'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; value: string; href: string };

export type Block =
  | { type: 'heading'; level: 2 | 3; content: Inline[]; id: string }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; content: Inline[] };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/** Parse inline markers within a line. Order matters: code, link, strong, em. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/;
  let rest = text;

  while (rest.length > 0) {
    const match = pattern.exec(rest);
    if (!match || match.index === undefined) {
      out.push({ type: 'text', value: rest });
      break;
    }
    if (match.index > 0) {
      out.push({ type: 'text', value: rest.slice(0, match.index) });
    }
    const token = match[0];
    if (token.startsWith('`')) {
      out.push({ type: 'code', value: token.slice(1, -1) });
    } else if (token.startsWith('[')) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) out.push({ type: 'link', value: linkMatch[1], href: linkMatch[2] });
    } else if (token.startsWith('**')) {
      out.push({ type: 'strong', value: token.slice(2, -2) });
    } else {
      out.push({ type: 'em', value: token.slice(1, -1) });
    }
    rest = rest.slice(match.index + token.length);
  }
  return out.filter((i) => !(i.type === 'text' && i.value === ''));
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  // Normalise line endings first. On a CRLF checkout every line keeps a
  // trailing \r, which silently breaks the block matchers: the heading pattern
  // ends with `(.*)$` and `.` does not match \r, so it fails — while the
  // paragraph guard `^(#{2,3})\s` has no `$` and still matches. A heading then
  // belongs to neither branch and the loop stops advancing.
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Safety net: whatever the content, every iteration must consume at least
    // one line. If a future pattern ever fails to, skip the line rather than
    // hang the render.
    const startedAt = i;

    if (!line.trim()) {
      i++;
      continue;
    }

    // Headings
    const heading = /^(#{2,3})\s+(.*)$/.exec(line);
    if (heading) {
      const text = heading[2].trim();
      blocks.push({
        type: 'heading',
        level: heading[1].length === 2 ? 2 : 3,
        content: parseInline(text),
        id: slugify(text),
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push({ type: 'quote', content: parseInline(quoteLines.join(' ')) });
      continue;
    }

    // Lists
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      const items: Inline[][] = [];
      while (i < lines.length) {
        const itemMatch = ordered
          ? /^\d+\.\s+(.*)$/.exec(lines[i])
          : /^[-*]\s+(.*)$/.exec(lines[i]);
        if (!itemMatch) break;
        items.push(parseInline(itemMatch[1].trim()));
        i++;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Paragraph: gather until a blank line or a new block marker
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{2,3})\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('> ')
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }
    if (paragraphLines.length) {
      blocks.push({ type: 'paragraph', content: parseInline(paragraphLines.join(' ')) });
    }

    if (i === startedAt) i++;
  }

  return blocks;
}

/** Reading time at 220 words per minute, rounded up. */
export function readingMinutes(source: string): number {
  return Math.max(1, Math.ceil(source.split(/\s+/).length / 220));
}
