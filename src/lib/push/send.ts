import 'server-only';
import webpush from 'web-push';
import { serviceClient } from '@/lib/supabase';

/**
 * Web push — the notification the owner actually runs the business from.
 *
 * The client asked for this to behave the way a messaging app does: an order
 * lands, the phone buzzes, tapping it opens that order. Everything here is in
 * service of that one sentence.
 *
 * Sending is deliberately best-effort and never throws into the caller. An
 * order must be recorded even if the notification fails — a customer who paid
 * and got no order because a push gateway was down would be the worst possible
 * trade.
 */

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

function configured(): boolean {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:orders@orielpower.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  return true;
}

/**
 * Fan a notification out to every registered device.
 *
 * Dead subscriptions are pruned as they are discovered: a 404 or 410 from the
 * push service means the browser threw the subscription away, and retrying it
 * forever would slow every future send.
 */
export async function sendPushToStaff(payload: PushPayload): Promise<{
  sent: number;
  pruned: number;
}> {
  if (!configured()) return { sent: 0, pruned: 0 };

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth');

  if (error || !data || data.length === 0) return { sent: 0, pruned: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  const dead: string[] = [];

  await Promise.all(
    data.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint as string,
            keys: { p256dh: row.p256dh as string, auth: row.auth as string },
          },
          body,
          { TTL: 60 * 60 * 24, urgency: 'high' }
        );
        sent += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(row.id as string);
        else console.error('Push send failed:', (e as Error).message);
      }
    })
  );

  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', dead);
  }

  return { sent, pruned: dead.length };
}

/** The wording the owner sees on his lock screen when an order lands. */
export function orderNotification(order: {
  orderNumber: string;
  customerName: string;
  county: string;
  total: number;
  paymentOption: string;
}): PushPayload {
  const amount = `KES ${order.total.toLocaleString('en-KE')}`;
  const how =
    order.paymentOption === 'pay_on_delivery' ? 'Pay on delivery' : 'Paying now';
  return {
    title: `New order — ${amount}`,
    body: `${order.customerName} · ${order.county} · ${how}`,
    url: `/admin/orders/${order.orderNumber}`,
    tag: `order-${order.orderNumber}`,
  };
}
