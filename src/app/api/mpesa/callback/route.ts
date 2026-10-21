import { NextResponse } from 'next/server';
import { parseCallback } from '@/lib/mpesa/client';
import { logMpesa } from '@/lib/mpesa/log';
import { applyCallback } from '@/lib/mpesa/payments';

/**
 * Daraja's callback endpoint — public, called by Safaricom.
 *
 * CRITICAL (MASTERPLAN 10.5): this route ALWAYS returns
 * { ResultCode: 0, ResultDesc: "Accepted" } with HTTP 200, even when our own
 * processing fails. A non-200 makes Daraja retry indefinitely. Internal
 * errors are logged and handled out of band.
 */
export const dynamic = 'force-dynamic';

const ACCEPTED = { ResultCode: 0, ResultDesc: 'Accepted' };

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    await logMpesa({
      direction: 'callback',
      endpoint: 'mpesa/callback',
      payload: { error: 'unparseable body' },
    });
    return NextResponse.json(ACCEPTED, { status: 200 });
  }

  try {
    await logMpesa({ direction: 'callback', endpoint: 'mpesa/callback', payload: body });

    const parsed = parseCallback(body);
    if (parsed) {
      // Idempotent: a duplicate callback for the same CheckoutRequestID is
      // acknowledged here and ignored by applyOutcome.
      await applyCallback(parsed);
    }
  } catch (error) {
    await logMpesa({
      direction: 'callback',
      endpoint: 'mpesa/callback',
      payload: { error: error instanceof Error ? error.message : 'processing failed' },
    });
  }

  return NextResponse.json(ACCEPTED, { status: 200 });
}
