import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normaliseMsisdn } from '@/lib/checkout-schema';
import { sessionCookieName, verifySessionToken } from '@/lib/admin/session';
import { startPayment } from '@/lib/mpesa/payments';
import { checkRateLimit } from '@/lib/mpesa/rate-limit';
import { getOrder } from '@/lib/orders/store';

/**
 * COD payment trigger (Flow B, MASTERPLAN 10.4) — staff tap this at handover.
 *
 * AUTH: accepts either a signed staff session cookie (the admin dashboard) or
 * the x-staff-key header (scripts and integration tests), both derived from
 * ADMIN_STAFF_KEY. The route REFUSES to run when that variable is unset, so it
 * can never be left open by accident. Supabase Auth replaces both once the
 * project is provisioned.
 */
export const dynamic = 'force-dynamic';

function isAuthorised(request: Request, staffKey: string): boolean {
  if (request.headers.get('x-staff-key') === staffKey) return true;
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([name]) => name === sessionCookieName())?.[1];
  return verifySessionToken(cookie ? decodeURIComponent(cookie) : undefined);
}

const schema = z.object({
  /** Editable DOWNWARDS only, with a mandatory reason. */
  amount: z.number().int().positive().optional(),
  amountChangeReason: z.string().trim().max(200).optional(),
  /** Staff may retarget if the customer pays from another phone. */
  msisdn: z.string().trim().max(20).optional(),
});

const MAX_ATTEMPTS = 3;

export async function POST(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  const staffKey = process.env.ADMIN_STAFF_KEY;
  if (!staffKey) {
    return NextResponse.json(
      { ok: false, error: 'Staff payment triggering is not configured on this deployment.' },
      { status: 503 }
    );
  }
  if (!isAuthorised(request, staffKey)) {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // An empty body is valid: request the full order total to the order phone.
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const order = await getOrder(params.orderNumber);
  if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });

  if (order.paymentOption !== 'pay_on_delivery') {
    return NextResponse.json(
      { ok: false, error: 'This is not a pay-on-delivery order' },
      { status: 400 }
    );
  }

  // Staff may resend up to three times per order (MASTERPLAN 10.4 step 7).
  const attempts = order.payments.filter((p) => p.actor?.startsWith('staff')).length;
  if (attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      {
        ok: false,
        error: `Three payment requests have already been sent for this order. Call the office before trying again.`,
      },
      { status: 429 }
    );
  }

  const msisdn = parsed.data.msisdn ? normaliseMsisdn(parsed.data.msisdn) : order.phone;
  if (!msisdn) {
    return NextResponse.json(
      { ok: false, error: "That doesn't look like a valid M-Pesa number" },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'staff';
  const limit = checkRateLimit(ip, msisdn);
  if (!limit.allowed) {
    return NextResponse.json({ ok: false, error: limit.message }, { status: 429 });
  }

  const result = await startPayment({
    orderNumber: order.orderNumber,
    msisdn,
    amount: parsed.data.amount,
    amountChangeReason: parsed.data.amountChangeReason,
    actor: 'staff',
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
