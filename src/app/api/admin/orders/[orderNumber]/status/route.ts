import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySessionToken, sessionCookieName } from '@/lib/admin/session';
import { updateOrderStatus } from '@/lib/orders/store';

/** Staff order-status transitions. Session-gated. */
export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum([
    'pending_payment',
    'paid',
    'payment_failed',
    'pending_cod',
    'processing',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  note: z.string().trim().max(300).optional(),
});

export async function POST(request: Request, { params }: { params: { orderNumber: string } }) {
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([name]) => name === sessionCookieName())?.[1];
  if (!verifySessionToken(cookie ? decodeURIComponent(cookie) : undefined)) {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 });
  }

  try {
    const order = await updateOrderStatus(
      params.orderNumber,
      parsed.data.status,
      'staff',
      parsed.data.note
    );
    return NextResponse.json({ ok: true, status: order.status });
  } catch (error) {
    // The COD "cannot deliver unpaid" rule surfaces here as a clear refusal.
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "That status change isn't allowed for this order.",
      },
      { status: 409 }
    );
  }
}
