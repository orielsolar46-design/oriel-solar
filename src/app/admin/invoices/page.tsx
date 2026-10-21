import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, Plus, Receipt, Wallet } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { listDocuments } from '@/lib/documents/store';
import {
  DOCUMENT_STATUS_LABEL,
  formatAmount,
  formatDocumentDate,
  type DocumentStatus,
} from '@/lib/documents/types';
import {
  EmptyState,
  FilterChips,
  PageHeader,
  StatCard,
  TableWrap,
  Td,
  Th,
  Pill,
} from '@/components/admin/ui';

/**
 * Every invoice and receipt, walk-in and web alike, in one series.
 *
 * The two halves of the business are deliberately not separated into two
 * lists. When a customer rings with a number, nobody knows or cares whether
 * they bought over the counter or on the site — they want the document.
 */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Invoices & receipts' };

const STATUS_TONE: Record<DocumentStatus, 'plain' | 'green' | 'gold' | 'orange' | 'navy'> = {
  draft: 'plain',
  issued: 'navy',
  part_paid: 'gold',
  paid: 'green',
  void: 'orange',
};

const FILTERS = [
  { id: '', label: 'Everything' },
  { id: 'unpaid', label: 'Owed' },
  { id: 'receipt', label: 'Receipts' },
  { id: 'invoice', label: 'Invoices' },
  { id: 'draft', label: 'Drafts' },
];

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: { filter?: string; q?: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const filter = searchParams.filter ?? '';
  const search = searchParams.q ?? '';
  const all = await listDocuments({ search });

  const live = all.filter((d) => d.status !== 'void');
  const owed = live.filter((d) => d.balance > 0 && d.status !== 'draft');
  const drafts = all.filter((d) => d.status === 'draft');

  const shown = all.filter((doc) => {
    if (filter === 'unpaid') return doc.balance > 0 && doc.status !== 'draft' && doc.status !== 'void';
    if (filter === 'receipt') return doc.docType === 'receipt';
    if (filter === 'invoice') return doc.docType === 'invoice';
    if (filter === 'draft') return doc.status === 'draft';
    return true;
  });

  const thisMonth = new Date().toISOString().slice(0, 7);
  const takenThisMonth = live
    .filter((d) => (d.issuedAt ?? d.createdAt).startsWith(thisMonth))
    .reduce((sum, d) => sum + d.amountPaid, 0);

  const counts = {
    '': all.length,
    unpaid: owed.length,
    receipt: all.filter((d) => d.docType === 'receipt').length,
    invoice: all.filter((d) => d.docType === 'invoice').length,
    draft: drafts.length,
  } as Record<string, number>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & receipts"
        subtitle="Counter sales and web orders, in one numbered series."
      >
        <Link
          href="/admin/invoices/new"
          className="inline-flex h-11 items-center gap-2 rounded-pill bg-oriel-orange px-5 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
        >
          <Plus size={17} strokeWidth={1.5} aria-hidden /> Write one
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Taken this month"
          value={formatAmount(takenThisMonth)}
          sub="Across every document issued"
          tone="green"
          icon={<Wallet size={17} strokeWidth={1.5} />}
        />
        <StatCard
          label="Still owed"
          value={formatAmount(owed.reduce((sum, d) => sum + d.balance, 0))}
          sub={`${owed.length} document${owed.length === 1 ? '' : 's'} outstanding`}
          tone={owed.length ? 'orange' : 'plain'}
          icon={<FileText size={17} strokeWidth={1.5} />}
          href="/admin/invoices?filter=unpaid"
        />
        <StatCard
          label="Drafts"
          value={String(drafts.length)}
          sub="Written but not yet issued"
          tone={drafts.length ? 'gold' : 'plain'}
          icon={<Receipt size={17} strokeWidth={1.5} />}
          href="/admin/invoices?filter=draft"
        />
      </div>

      <form action="/admin/invoices" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search by number, name or phone"
          className="h-11 flex-1 rounded-input border border-oriel-line bg-oriel-white px-4 text-small text-oriel-navy-ink placeholder:text-oriel-slate/70 focus:border-oriel-navy focus:outline-none focus:ring-2 focus:ring-oriel-navy/20"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-pill border border-oriel-line px-5 text-small font-semibold text-oriel-navy transition-colors hover:border-oriel-navy"
        >
          Search
        </button>
      </form>

      <FilterChips
        filters={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))}
        active={filter}
        hrefFor={(id) =>
          `/admin/invoices${id || search ? '?' : ''}${id ? `filter=${id}` : ''}${
            id && search ? '&' : ''
          }${search ? `q=${encodeURIComponent(search)}` : ''}`
        }
      />

      {shown.length === 0 ? (
        <EmptyState
          title={search ? 'Nothing matched that search' : 'Nothing here yet'}
          hint={
            search
              ? 'Try just the surname, or the last few digits of the phone number.'
              : 'Write a receipt for a counter sale, or place a web order — those generate their own.'
          }
        />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Number</Th>
              <Th>Customer</Th>
              <Th>Date</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Balance</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {shown.map((doc) => (
              <tr key={doc.id} className="transition-colors hover:bg-oriel-mist/50">
                <Td>
                  <Link
                    href={`/admin/invoices/${doc.id}`}
                    className="font-mono text-small font-medium text-oriel-navy underline-offset-2 hover:underline"
                  >
                    {doc.docNumber ?? 'Draft'}
                  </Link>
                  <span className="mt-0.5 block text-micro text-oriel-slate">
                    {doc.docType === 'receipt' ? 'Receipt' : 'Invoice'}
                    {doc.source === 'order' ? ' · web order' : ' · counter'}
                  </span>
                </Td>
                <Td>
                  <span className="block truncate">{doc.customerName}</span>
                  {doc.customerPhone && (
                    <span className="mt-0.5 block font-mono text-micro text-oriel-slate">
                      {doc.customerPhone}
                    </span>
                  )}
                </Td>
                <Td className="whitespace-nowrap font-mono text-micro">
                  {formatDocumentDate(doc.issuedAt ?? doc.createdAt)}
                </Td>
                <Td className="text-right font-mono">{formatAmount(doc.total)}</Td>
                <Td
                  className={`text-right font-mono ${
                    doc.balance > 0 && doc.status !== 'void'
                      ? 'font-medium text-oriel-orange-deep'
                      : 'text-oriel-slate'
                  }`}
                >
                  {formatAmount(doc.balance)}
                </Td>
                <Td>
                  <Pill tone={STATUS_TONE[doc.status]}>{DOCUMENT_STATUS_LABEL[doc.status]}</Pill>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </div>
  );
}
