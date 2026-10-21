import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { ImportWizard } from '@/components/admin/import-wizard';

export const dynamic = 'force-dynamic';

export default function AdminImport() {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="t-h2">Import supplier prices</h1>
        <p className="mt-1 max-w-2xl text-small text-oriel-slate">
          Upload a supplier&apos;s new price list and see exactly what would change before
          anything is applied. Retail prices are recalculated from the new cost using the current
          markup, VAT rules and rounding.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
