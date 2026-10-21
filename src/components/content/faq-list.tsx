import { ChevronRight } from 'lucide-react';

export type Faq = { question: string; answer: string };

/**
 * Accessible FAQ accordion using native details/summary — keyboard-operable
 * and functional without JavaScript. Emits FAQPage JSON-LD when asked.
 */
export function FaqList({
  faqs,
  heading = 'Common questions',
  withSchema = false,
}: {
  faqs: Faq[];
  heading?: string;
  withSchema?: boolean;
}) {
  if (faqs.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading">
      {withSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: { '@type': 'Answer', text: f.answer },
              })),
            }),
          }}
        />
      )}
      <h2 id="faq-heading" className="t-h2">
        {heading}
      </h2>
      <div className="mt-5 max-w-2xl divide-y divide-oriel-line border-y border-oriel-line">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[0.9375rem] font-semibold text-oriel-navy [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronRight
                size={18}
                strokeWidth={1.5}
                className="shrink-0 transition-transform duration-200 group-open:rotate-90"
                aria-hidden
              />
            </summary>
            <p className="mt-3 text-body text-oriel-navy-ink">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
