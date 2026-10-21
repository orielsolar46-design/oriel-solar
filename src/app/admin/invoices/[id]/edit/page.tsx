import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getDocument } from '@/lib/documents/store';
import { DocumentForm } from '@/components/admin/document-form';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Edit document' };

export default async function EditDocumentPage({ params }: { params: { id: string } }) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const doc = await getDocument(params.id);
  if (!doc) notFound();
  // Voided documents are the record of a mistake. Editing one would let
  // somebody quietly rewrite what a cancelled sale said it was.
  if (doc.status === 'void') redirect(`/admin/invoices/${doc.id}`);

  return (
    <div className="space-y-5">
      <Link
        href={`/admin/invoices/${doc.id}`}
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate hover:text-oriel-navy"
      >
        <ChevronLeft size={16} strokeWidth={1.5} /> {doc.docNumber ?? 'Draft'}
      </Link>

      <div>
        <h1 className="font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
          Edit {doc.docNumber ?? 'this draft'}
        </h1>
        {doc.docNumber && (
          <p className="mt-1 text-small text-oriel-slate">
            This document has already been issued. It keeps its number — if the customer has the
            old version, send them the corrected one.
          </p>
        )}
      </div>

      <DocumentForm existing={doc} />
    </div>
  );
}
