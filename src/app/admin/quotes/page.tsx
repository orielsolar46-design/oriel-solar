import { redirect } from 'next/navigation';
import { FileText, Phone, ShieldCheck, Ruler } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getQuoteRequests } from '@/lib/admin/data';
import { EmptyState, PageHeader, Pill } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const KIND = {
  quote: { label: 'Quotation', icon: FileText },
  survey: { label: 'Site survey', icon: Ruler },
  warranty: { label: 'Warranty registration', icon: ShieldCheck },
} as const;

export default async function AdminQuotes() {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const quotes = await getQuoteRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quote requests"
        subtitle="Quotation requests, survey bookings and warranty registrations, newest first."
      />

      {quotes.length === 0 ? (
        <EmptyState
          title="No requests yet"
          hint="Requests from the quote form, survey booking and warranty registration arrive here."
        />
      ) : (
        <ul className="space-y-2">
          {quotes.map((q, i) => {
            const kind = KIND[q.kind as keyof typeof KIND] ?? KIND.quote;
            const Icon = kind.icon;
            return (
              <li
                key={`${q.phone}-${q.received_at}-${i}`}
                className="rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Pill
                      tone={q.kind === 'warranty' ? 'green' : q.kind === 'survey' ? 'gold' : 'orange'}
                      className="gap-1.5"
                    >
                      <Icon size={11} strokeWidth={2} aria-hidden />
                      {kind.label}
                    </Pill>
                    <p className="mt-1.5 text-small font-semibold text-oriel-navy">{q.name}</p>
                    <p className="font-mono text-[0.6875rem] text-oriel-slate">
                      {q.phone}
                      {q.email ? ` · ${q.email}` : ''}
                      {q.county ? ` · ${q.county}` : ''}
                      {q.orderNumber ? ` · ${q.orderNumber}` : ''}
                    </p>
                    {q.productSlug && (
                      <p className="mt-1 font-mono text-[0.6875rem] text-oriel-navy-ink">
                        About: {q.productSlug}
                      </p>
                    )}
                    {q.message && (
                      <p className="mt-2 whitespace-pre-wrap rounded-input bg-oriel-mist p-3 text-small text-oriel-navy-ink">
                        {q.message}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <a
                      href={`tel:+${q.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-input bg-oriel-orange px-3.5 py-2 text-small font-semibold text-oriel-white"
                    >
                      <Phone size={14} strokeWidth={1.5} aria-hidden /> Call
                    </a>
                    <p className="mt-1 font-mono text-[0.625rem] text-oriel-slate">
                      {new Date(q.received_at).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
