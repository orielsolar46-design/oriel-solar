import { notFound, redirect } from 'next/navigation';
import { getAdminProducts, retailFor } from '@/lib/admin/data';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { QuickEdit } from '@/components/admin/quick-edit';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Quick edit' };

export default async function QuickEditPage({ params }: { params: { slug: string } }) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const product = (await getAdminProducts()).find((p) => p.slug === params.slug);
  if (!product) notFound();

  // Cost is held either VAT-inclusive or not depending on the supplier list, so
  // it is normalised here rather than in the browser — the client only ever
  // sees one comparable figure, and the rule lives with the rest of the pricing.
  const costExVat =
    product.costPrice != null
      ? product.sourceVatInclusive
        ? product.costPrice / 1.16
        : product.costPrice
      : null;

  return (
    <QuickEdit
      slug={product.slug}
      name={product.name}
      brand={product.brand}
      modelCode={product.modelCode}
      costExVat={costExVat}
      suggestedPrice={retailFor(product.costPrice, product.sourceVatInclusive)}
      initialPrice={product.retailPrice}
      initialImages={product.images}
      shopHref={`/shop/${product.category}/${product.slug}`}
    />
  );
}
