import { highlightTerms } from '@/lib/search';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Marks the words a shopper typed inside a result title, so it is obvious
 * why a product is on the page. Matching is case-insensitive and on word
 * boundaries, so "win" does not light up inside "window".
 */
export function SearchHighlight({ text, terms }: { text: string; terms: string[] }) {
  const usable = terms.filter((t) => t.length >= 2);
  if (usable.length === 0) return <>{text}</>;

  const pattern = new RegExp(`\\b(${usable.map(escapeRegExp).join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        usable.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={index}
            className="rounded-[2px] bg-oriel-gold-soft px-0.5 text-oriel-navy-ink"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}
