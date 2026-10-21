import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrder } from '@/lib/orders/store';
import { OrderSummary } from '@/components/orders/order-summary';

export const metadata: Metadata = {
  title: 'Order status',
  robots: { index: false },
};

type Props = {
  params: { orderNumber: string };
  searchParams: { token?: string | string[] };
};

/**
 * Token-guarded public order page (MASTERPLAN Section 4). The order number
 * alone is not enough — the emailed link carries an access token, so a
 * guessed number reveals nothing.
 */
export default async function OrderPage({ params, searchParams }: Props) {
  const token = Array.isArray(searchParams.token) ? searchParams.token[0] : searchParams.token;
  const order = await getOrder(params.orderNumber);
  const authorised = order && token && token === order.accessToken;

  if (!authorised) {
    return (
      <div className="container-oriel py-16">
        <div className="mx-auto max-w-lg rounded-card border border-oriel-line bg-oriel-mist p-8">
          <h1 className="t-h2">We can&apos;t show that order</h1>
          <p className="mt-3 text-body text-oriel-navy-ink">
            This link is missing its access code, or the order number doesn&apos;t match. Use the
            link from your confirmation email or SMS.
          </p>
          <p className="mt-2 text-small text-oriel-slate">
            You can also look it up with your order number and phone number.
          </p>
          <Link
            href="/track-order"
            className="mt-5 inline-flex items-center rounded-input bg-oriel-orange px-5 py-2.5 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
          >
            Track my order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-oriel py-10">
      <OrderSummary order={order} />
    </div>
  );
}
