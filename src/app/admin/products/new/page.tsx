import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/admin/product-form';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getBrandOptions } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

export default async function NewProduct() {
  if (!isStaffAuthenticated()) redirect('/admin/login');
  const brands = await getBrandOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-small font-medium text-oriel-slate hover:text-oriel-navy"
        >
          <ArrowLeft size={15} strokeWidth={1.5} aria-hidden /> Products
        </Link>
        <h1 className="t-h2 mt-2">Add a product</h1>
        <p className="mt-1 text-small text-oriel-slate">
          It goes on the shop as soon as you save, with a price and a photograph.
        </p>
      </div>

      <ProductForm brands={brands} />
    </div>
  );
}
