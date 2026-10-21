import { NextResponse } from 'next/server';
import { isSimulated } from '@/lib/mpesa/client';
import { applyCallback, markTimedOut, resolveViaStatusQuery } from '@/lib/mpesa/payments';
import { parseCallback } from '@/lib/mpesa/client';
import { findOrderByCheckoutId } from '@/lib/orders/store';

/**
 * Status polling for the waiting modal (MASTERPLAN 10.3 steps 5–7).
 *
 * The page polls every 4 seconds while Daraja hits the callback in parallel;
 * resolution comes from the callback wherever possible. If no callback has
 * arrived after 150 seconds, this route runs the status query as the fallback
 * BEFORE any failure is declared — Kenyan networks drop callbacks, and that
 * fallback is not optional.
 */
export const dynamic = 'force-dynamic';

const CALLBACK_GRACE_MS = 150_000;

export async function GET(
  _request: Request,
  { params }: { params: { checkoutRequestId: string } }
) {
  const checkoutRequestId = params.checkoutRequestId;

  // In simulator mode the "network" delivers the callback via this poll —
  // a real deployment receives it on /api/mpesa/callback from Safaricom.
  if (isSimulated()) {
    const { simulatedCallbackBody } = await import('@/lib/mpesa/simulator');
    const body = await simulatedCallbackBody(checkoutRequestId);
    if (body) {
      const parsed = parseCallback(body);
      if (parsed) await applyCallback(parsed);
    }
  }

  const order = await findOrderByCheckoutId(checkoutRequestId);
  if (!order) {
    return NextResponse.json({ ok: false, state: 'unknown' }, { status: 404 });
  }
  const payment = order.payments.find((p) => p.checkoutRequestId === checkoutRequestId)!;

  if (payment.status === 'initiated') {
    const age = Date.now() - new Date(payment.at).getTime();
    if (age > CALLBACK_GRACE_MS) {
      // No callback in 150s — run the fallback query before declaring failure.
      const resolved = await resolveViaStatusQuery(checkoutRequestId);
      if (!resolved) {
        await markTimedOut(checkoutRequestId);
      }
      const refreshed = await findOrderByCheckoutId(checkoutRequestId);
      const refreshedPayment = refreshed?.payments.find(
        (p) => p.checkoutRequestId === checkoutRequestId
      );
      return NextResponse.json({
        ok: true,
        state: refreshedPayment?.status ?? 'failed',
        orderStatus: refreshed?.status,
        receipt: refreshedPayment?.mpesaReceipt ?? null,
        resultDesc: refreshedPayment?.resultDesc ?? null,
        resolvedBy: 'status-query-fallback',
      });
    }
    return NextResponse.json({
      ok: true,
      state: 'pending',
      orderStatus: order.status,
      waitedMs: age,
    });
  }

  return NextResponse.json({
    ok: true,
    state: payment.status,
    orderStatus: order.status,
    receipt: payment.mpesaReceipt ?? null,
    resultCode: payment.resultCode ?? null,
    resultDesc: payment.resultDesc ?? null,
  });
}
