import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normaliseMsisdn } from '@/lib/checkout-schema';
import { findOrderByPhone } from '@/lib/orders/store';

/**
 * Order lookup for /track-order: order number plus the phone number the order
 * was placed with. Returns the access token so the caller can be redirected
 * to the guarded status page. A wrong pair returns the same generic message
 * either way — order numbers are sequential and must not be enumerable.
 */
const schema = z.object({
  orderNumber: z.string().trim().min(6).max(40),
  phone: z.string().trim().min(9).max(20),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Enter your order number and phone number.' },
      { status: 400 }
    );
  }
  const phone = normaliseMsisdn(parsed.data.phone);
  const notFound = NextResponse.json(
    {
      ok: false,
      error:
        "We couldn't find an order with those details. Check the order number and the phone number you ordered with.",
    },
    { status: 404 }
  );
  if (!phone) return notFound;

  const order = await findOrderByPhone(parsed.data.orderNumber.trim().toUpperCase(), phone);
  if (!order) return notFound;

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
  });
}
