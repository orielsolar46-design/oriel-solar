import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/cart-page';

export const metadata: Metadata = {
  title: 'Basket',
  description: 'Review your items, delivery and installation before checkout.',
};

export default function Page() {
  return <CartPage />;
}
