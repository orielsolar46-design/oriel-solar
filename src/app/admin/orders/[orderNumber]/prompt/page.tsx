import { notFound, redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { getOrder } from '@/lib/orders/store';
import { SendPrompt } from '@/components/admin/send-prompt';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Send a payment prompt' };

export default async function SendPromptPage({
  params,
}: {
  params: { orderNumber: string };
}) {
  if (!isStaffAuthenticated()) redirect('/admin/login');

  const order = await getOrder(params.orderNumber);
  if (!order) notFound();

  // An order that is already settled has nothing to prompt for, and sending
  // one anyway is how a customer gets charged twice.
  if (order.payments.some((p) => p.status === 'paid')) {
    redirect(`/admin/orders/${order.orderNumber}`);
  }

  return (
    <SendPrompt
      orderNumber={order.orderNumber}
      customerName={order.customerName}
      total={order.total}
      phone={order.phone}
      attemptsSoFar={order.payments.length}
    />
  );
}
