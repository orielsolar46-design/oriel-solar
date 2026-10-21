import type { Metadata } from 'next';
import { TrackOrderForm } from '@/components/orders/track-order-form';

export const metadata: Metadata = {
  title: 'Track your order',
  description:
    'Look up an Oriel Solar order with your order number and the phone number you ordered with.',
};

export default function TrackOrderPage() {
  return (
    <div className="container-oriel py-12">
      <div className="mx-auto max-w-lg">
        <p className="t-eyebrow text-oriel-slate">Orders</p>
        <h1 className="t-h1 mt-1">Track your order</h1>
        <p className="mt-3 text-body text-oriel-navy-ink">
          Enter your order number and the phone number you ordered with. Your order number looks
          like <span className="font-mono">ORL-2607-00184</span> and is in your confirmation SMS.
        </p>
        <TrackOrderForm />
      </div>
    </div>
  );
}
