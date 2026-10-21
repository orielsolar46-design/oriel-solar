import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { DocumentForm } from '@/components/admin/document-form';

/** Write a receipt or invoice by hand — the counter sale, the site visit. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Write a document' };

export default function NewDocumentPage() {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  return (
    <div className="space-y-5">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate hover:text-oriel-navy"
      >
        <ChevronLeft size={16} strokeWidth={1.5} /> Invoices &amp; receipts
      </Link>

      <div>
        <h1 className="font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
          Write a document
        </h1>
        <p className="mt-1 text-small text-oriel-slate">
          For a customer who bought at the counter or over the phone. Web orders write their own.
        </p>
      </div>

      <DocumentForm />
    </div>
  );
}
