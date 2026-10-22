import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calculator, MessageSquare, Phone } from 'lucide-react';
import { GmailIcon } from '@/components/ui/brand-icons';
import { Button } from '@/components/ui/button';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getCalculatorLeads, getMessages } from '@/lib/admin/data';
import { EmptyState, FilterChips, PageHeader } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function AdminInbox({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const [messages, leads] = await Promise.all([getMessages(), getCalculatorLeads()]);
  const tab = searchParams.tab === 'leads' ? 'leads' : 'messages';

  return (
    <div className="space-y-6">
      <PageHeader title="Inbox" subtitle="Call-back requests, newest first." />

      <FilterChips
        filters={[
          { id: 'messages', label: 'Call-backs', count: messages.length },
          // The sizing calculator has been removed, so no new leads arrive
          // here. The tab stays while historical leads exist so staff can
          // still follow them up, and disappears once they are worked through.
          ...(leads.length > 0
            ? [{ id: 'leads', label: 'Past sizing leads', count: leads.length }]
            : []),
        ]}
        active={tab}
        hrefFor={(id) => `/admin/inbox?tab=${id}`}
      />

      {tab === 'messages' ? (
        messages.length === 0 ? (
          <EmptyState
            title="No call-back requests yet"
            hint="Requests from the contact band and contact page arrive here."
          />
        ) : (
          <ul className="space-y-2">
            {messages.map((m, i) => (
              <li
                key={`${m.phone}-${i}`}
                className="rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-small font-semibold text-oriel-navy">
                      <MessageSquare size={15} strokeWidth={1.5} aria-hidden /> {m.name}
                    </p>
                    <p className="mt-1 text-small text-oriel-navy-ink">{m.need}</p>
                    <p className="mt-0.5 text-micro text-oriel-slate">{m.county}</p>
                  </div>
                  <div className="text-right">
                    <Button asChild size="sm">
                      <a href={`tel:${m.phone}`}>
                        <Phone size={14} strokeWidth={1.5} aria-hidden /> Call back
                      </a>
                    </Button>
                    <p className="mt-1 font-mono text-[0.6875rem] text-oriel-slate">{m.phone}</p>
                    <p className="font-mono text-[0.625rem] text-oriel-slate">
                      {new Date(m.received_at).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : leads.length === 0 ? (
<EmptyState title="No sizing leads" />
      ) : (
        <ul className="space-y-2">
          {leads.map((l, i) => {
            const rec = l.recommendation as Record<string, number | undefined>;
            const inputs = l.inputs as Record<string, string | undefined>;
            return (
              <li
                key={`${l.email}-${i}`}
                className="rounded-card border border-oriel-line bg-oriel-white p-4 shadow-oriel-rest"
              >
                <p className="flex items-center gap-2 text-small font-semibold text-oriel-navy">
                  <Calculator size={15} strokeWidth={1.5} aria-hidden /> {l.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-micro text-oriel-navy-ink">
                  {rec.arrayKw != null && <span>{rec.arrayKw} kW array</span>}
                  {rec.inverterKw != null && <span>{rec.inverterKw} kW inverter</span>}
                  {rec.batteryKwh != null && <span>{rec.batteryKwh} kWh battery</span>}
                </div>
                <p className="mt-1 text-micro text-oriel-slate">
                  {inputs.county ?? 'county not given'} ·{' '}
                  {new Date(l.received_at).toLocaleString('en-KE')}
                </p>
                <a
                  href={`mailto:${l.email}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-small font-semibold text-oriel-navy underline decoration-oriel-orange decoration-2 underline-offset-2"
                >
                  <GmailIcon size={14} />
                  Email this customer
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
