import 'server-only';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { logMpesa } from '@/lib/mpesa/log';

/**
 * Daraja simulator — DEVELOPMENT ONLY.
 *
 * Exists so both payment flows (pay-now and pay-on-delivery) and every
 * failure path can be built, tested and demonstrated before Safaricom
 * credentials are issued. It emulates Daraja's shapes and timing: an
 * immediate push acknowledgement, then a callback a few seconds later.
 *
 * The client module refuses to reach this file when
 * MPESA_ENVIRONMENT=production, so it can never touch real money.
 *
 * Outcome is chosen by the LAST DIGIT of the paying phone number, which makes
 * every scenario reproducible in a demo:
 *   ...0  → success
 *   ...1  → cancelled on the phone      (ResultCode 1032)
 *   ...2  → no response from the phone  (ResultCode 1037)
 *   ...3  → insufficient funds          (ResultCode 1)
 *   ...4  → wrong PIN                   (ResultCode 2001)
 *   ...5  → callback never arrives (exercises the status-query fallback)
 *   other → success
 */

type Pending = {
  checkoutRequestId: string;
  merchantRequestId: string;
  msisdn: string;
  amount: number;
  orderNumber: string;
  resultCode: number;
  resultDesc: string;
  /** When the simulated callback becomes deliverable. */
  resolvesAt: number;
  /** True when this run deliberately drops the callback. */
  dropCallback: boolean;
};

const OUTCOMES: Record<string, { code: number; desc: string; drop?: boolean }> = {
  '0': { code: 0, desc: 'The service request is processed successfully.' },
  '1': { code: 1032, desc: 'Request cancelled by user' },
  '2': { code: 1037, desc: 'DS timeout user cannot be reached' },
  '3': { code: 1, desc: 'The balance is insufficient for the transaction' },
  '4': { code: 2001, desc: 'The initiator information is invalid.' },
  '5': { code: 0, desc: 'The service request is processed successfully.', drop: true },
};

/**
 * Simulator state is file-backed, not in-memory: Next.js dev recompiles route
 * handlers independently, which would otherwise give the push route and the
 * status route separate copies of the map and strand a pending transaction.
 */
const STORE = path.join(process.cwd(), 'data', 'dev-mpesa-sim.json');

async function readPending(): Promise<Record<string, Pending>> {
  try {
    return JSON.parse(await fs.readFile(STORE, 'utf-8'));
  } catch {
    return {};
  }
}

async function writePending(all: Record<string, Pending>): Promise<void> {
  try {
    await fs.writeFile(STORE, JSON.stringify(all, null, 2), 'utf-8');
  } catch {
    // Dev scaffolding only — never break a flow over this.
  }
}

function outcomeFor(msisdn: string) {
  return OUTCOMES[msisdn.slice(-1)] ?? { code: 0, desc: 'The service request is processed successfully.' };
}

export async function simulateStkPush(params: {
  msisdn: string;
  amount: number;
  orderNumber: string;
}): Promise<
  | { ok: true; checkoutRequestId: string; merchantRequestId: string; customerMessage: string }
  | { ok: false; error: string }
> {
  const outcome = outcomeFor(params.msisdn);
  const checkoutRequestId = `ws_CO_SIM_${randomUUID().slice(0, 8)}`;
  const merchantRequestId = `SIM-${randomUUID().slice(0, 8)}`;

  const all = await readPending();
  all[checkoutRequestId] = {
    checkoutRequestId,
    merchantRequestId,
    msisdn: params.msisdn,
    amount: params.amount,
    orderNumber: params.orderNumber,
    resultCode: outcome.code,
    resultDesc: outcome.desc,
    resolvesAt: Date.now() + 6000, // customer "reacts" after ~6 seconds
    dropCallback: Boolean(outcome.drop),
  };
  await writePending(all);

  await logMpesa({
    direction: 'request',
    endpoint: 'stkpush (SIMULATED)',
    orderNumber: params.orderNumber,
    checkoutRequestId,
    payload: {
      simulated: true,
      msisdn: params.msisdn,
      amount: params.amount,
      willResultIn: outcome.code,
      callbackDropped: Boolean(outcome.drop),
    },
  });

  return {
    ok: true,
    checkoutRequestId,
    merchantRequestId,
    customerMessage: 'Success. Request accepted for processing',
  };
}

/** The callback a real Daraja would POST, once the simulated wait elapses. */
export async function simulatedCallbackBody(checkoutRequestId: string): Promise<unknown | null> {
  const entry = (await readPending())[checkoutRequestId];
  if (!entry || Date.now() < entry.resolvesAt || entry.dropCallback) return null;

  const metadata =
    entry.resultCode === 0
      ? {
          Item: [
            { Name: 'Amount', Value: entry.amount },
            { Name: 'MpesaReceiptNumber', Value: `SIM${randomUUID().slice(0, 7).toUpperCase()}` },
            { Name: 'TransactionDate', Value: Number(new Date().toISOString().replace(/\D/g, '').slice(0, 14)) },
            { Name: 'PhoneNumber', Value: Number(entry.msisdn) },
          ],
        }
      : undefined;

  return {
    Body: {
      stkCallback: {
        MerchantRequestID: entry.merchantRequestId,
        CheckoutRequestID: entry.checkoutRequestId,
        ResultCode: entry.resultCode,
        ResultDesc: entry.resultDesc,
        ...(metadata ? { CallbackMetadata: metadata } : {}),
      },
    },
  };
}

/** Emulates the Daraja status query used as the missing-callback fallback. */
export async function simulateStatusQuery(
  checkoutRequestId: string
): Promise<{ ok: true; resultCode: number; resultDesc: string } | { ok: false; pending: boolean; error: string }> {
  const entry = (await readPending())[checkoutRequestId];
  if (!entry) {
    return { ok: false, pending: false, error: 'Unknown CheckoutRequestID' };
  }
  if (Date.now() < entry.resolvesAt) {
    return { ok: false, pending: true, error: 'Still processing' };
  }
  await logMpesa({
    direction: 'query',
    endpoint: 'stkpushquery (SIMULATED)',
    checkoutRequestId,
    payload: { simulated: true, ResultCode: entry.resultCode, ResultDesc: entry.resultDesc },
  });
  return { ok: true, resultCode: entry.resultCode, resultDesc: entry.resultDesc };
}

/** Test seam: lets a demo fast-forward instead of waiting out the delay. */
export async function fastForward(checkoutRequestId: string): Promise<boolean> {
  const all = await readPending();
  const entry = all[checkoutRequestId];
  if (!entry) return false;
  entry.resolvesAt = Date.now() - 1;
  await writePending(all);
  return true;
}
