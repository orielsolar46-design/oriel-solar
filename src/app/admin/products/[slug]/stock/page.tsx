import { notFound, redirect } from 'next/navigation';
import { getAdminProducts } from '@/lib/admin/data';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { SetStock } from '@/components/admin/set-stock';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Set stock' };

export default async function SetStockPage({ params }: { params: { slug: string } }) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const product = (await getAdminProducts()).find((p) => p.slug === params.slug);
  if (!product) notFound();

  return (
    <SetStock
      slug={product.slug}
      name={product.name}
      initialQty={product.stockQty}
      initialState={product.stockStatus}
    />
  );
}
