import Link from 'next/link';
import type { Block, Inline } from '@/lib/content/markdown';

/** Renders parsed markdown blocks as React. Nothing is dangerously set. */

function renderInline(content: Inline[]) {
  return content.map((node, i) => {
    switch (node.type) {
      case 'strong':
        return (
          <strong key={i} className="font-semibold text-oriel-navy">
            {node.value}
          </strong>
        );
      case 'em':
        return <em key={i}>{node.value}</em>;
      case 'code':
        return (
          <code key={i} className="rounded bg-oriel-mist px-1.5 py-0.5 font-mono text-[0.875em]">
            {node.value}
          </code>
        );
      case 'link': {
        const external = node.href.startsWith('http');
        const className =
          'font-medium text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2 hover:text-oriel-orange';
        return external ? (
          <a key={i} href={node.href} target="_blank" rel="noopener noreferrer" className={className}>
            {node.value}
          </a>
        ) : (
          <Link key={i} href={node.href} className={className}>
            {node.value}
          </Link>
        );
      }
      default:
        return <span key={i}>{node.value}</span>;
    }
  });
}

export function Prose({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-[68ch]">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return block.level === 2 ? (
              <h2 key={i} id={block.id} className="t-h2 mt-10 scroll-mt-24 first:mt-0">
                {renderInline(block.content)}
              </h2>
            ) : (
              <h3 key={i} id={block.id} className="t-h3 mt-7 scroll-mt-24">
                {renderInline(block.content)}
              </h3>
            );
          case 'paragraph':
            return (
              <p key={i} className="mt-4 text-body-lg leading-relaxed text-oriel-navy-ink">
                {renderInline(block.content)}
              </p>
            );
          case 'list':
            return block.ordered ? (
              <ol key={i} className="mt-4 space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-body-lg text-oriel-navy-ink">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-oriel-gold-soft font-mono text-micro font-medium text-oriel-navy-ink">
                      {j + 1}
                    </span>
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="mt-4 space-y-2">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-body-lg text-oriel-navy-ink">
                    <span
                      className="mt-3 h-1.5 w-1.5 shrink-0 rounded-pill bg-oriel-orange"
                      aria-hidden
                    />
                    <span>{renderInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={i}
                className="mt-6 border-l-4 border-oriel-gold bg-oriel-gold-soft py-4 pl-5 pr-4 text-body-lg text-oriel-navy-ink"
              >
                {renderInline(block.content)}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
