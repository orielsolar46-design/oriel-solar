import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/mpesa/rate-limit';
import { startPayment } from '@/lib/mpesa/payments';
import { normaliseMsisdn } from '@/lib/checkout-schema';
import { getOrder } from '@/lib/orders/store';

/**
 * Initiate an STK push for an order (Flow A, and retries). Guarded by the
 * order's access token so only the customer holding the confirmation link can
 * trigger a push, and rate limited per IP and per phone.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  orderNumber: z.string().trim().min(6).max(40),
  token: z.string().uuid(),
  /** Optional: pay from a different number. */
  msisdn: z.string().trim().max(20).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const order = await getOrder(parsed.data.orderNumber);
  if (!order || order.accessToken !== parsed.data.token) {
    return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
  }

  const msisdn = parsed.data.msisdn ? normaliseMsisdn(parsed.data.msisdn) : order.phone;
  if (!msisdn) {
    return NextResponse.json(
      { ok: false, error: "We couldn't read that number. Check it's the right M-Pesa line." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const limit = checkRateLimit(ip, msisdn);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: limit.message }, { status: 429 });
  }

  const result = await startPayment({
    orderNumber: order.orderNumber,
    msisdn,
    actor: 'customer',
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    checkoutRequestId: result.checkoutRequestId,
    amount: result.amount,
  });
}
