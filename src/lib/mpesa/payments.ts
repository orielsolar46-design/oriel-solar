import 'server-only';
import { initiateSTKPush, queryTransactionStatus, type ParsedCallback } from '@/lib/mpesa/client';
import { mapResultCode } from '@/lib/mpesa/errors';
import { logMpesa } from '@/lib/mpesa/log';
import { notifyPaymentReceived } from '@/lib/orders/notifications';
import {
  appendPayment,
  getOrder,
  updateOrderStatus,
  updatePaymentByCheckoutId,
  type OrderRecord,
} from '@/lib/orders/store';

/**
 * Shared payment machinery for both flows (MASTERPLAN Section 10). Flow A
 * (pay now) and Flow B (pay on delivery) differ only in WHEN startPayment is
 * called — everything below is common.
 */

export type StartPaymentResult =
  | { ok: true; checkoutRequestId: string; amount: number }
  | { ok: false; error: string };

/**
 * Send an STK push for an order. The amount is ALWAYS validated against the
 * order total server-side, on every push including COD triggers
 * (MASTERPLAN 10.5).
 */
export async function startPayment(params: {
  orderNumber: string;
  /** Override target number (staff may retry to a different phone). */
  msisdn?: string;
  /** COD only: amount may be edited DOWNWARDS with a mandatory reason. */
  amount?: number;
  amountChangeReason?: string;
  actor: string;
}): Promise<StartPaymentResult> {
  const order = await getOrder(params.orderNumber);
  if (!order) return { ok: false, error: 'Order not found' };

  if (order.status === 'paid' || order.status === 'delivered') {
    return { ok: false, error: 'This order is already paid' };
  }

  const msisdn = params.msisdn ?? order.phone;
  if (!/^254[71]\d{8}$/.test(msisdn)) {
    return { ok: false, error: "That doesn't look like a valid M-Pesa number" };
  }

  // Amount validation: never above the order total; downward edits need a reason.
  let amount = order.total;
  if (params.amount != null && params.amount !== order.total) {
    if (params.amount > order.total) {
      return { ok: false, error: 'The amount cannot be more than the order total' };
    }
    if (!params.amountChangeReason || params.amountChangeReason.trim().length < 3) {
      return { ok: false, error: 'A reason is required to change the amount' };
    }
    amount = params.amount;
  }
  if (amount < 1) return { ok: false, error: 'The amount must be at least KES 1' };

  const push = await initiateSTKPush({
    msisdn,
    amount,
    orderNumber: order.orderNumber,
  });
  if (!push.ok) return { ok: false, error: push.error };

  await appendPayment(order.orderNumber, {
    status: 'initiated',
    amount,
    phone: msisdn,
    checkoutRequestId: push.checkoutRequestId,
    merchantRequestId: push.merchantRequestId,
    amountChangeReason: params.amountChangeReason?.trim(),
    actor: params.actor,
  });

  return { ok: true, checkoutRequestId: push.checkoutRequestId, amount };
}

/**
 * Apply a resolved Daraja outcome to an order. Idempotent: a repeated
 * callback for the same CheckoutRequestID is acknowledged and ignored
 * (MASTERPLAN 10.5), so Daraja's retries can never double-pay an order.
 */
export async function applyOutcome(params: {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  receipt?: string;
  source: 'callback' | 'query';
}): Promise<{ applied: boolean; order?: OrderRecord }> {
  // Captured inside the mutator so the receipt is raised for the amount that
  // was actually pushed, which on a COD order may have been edited down from
  // the order total with a reason.
  let paidAmount: number | null = null;

  const result = await updatePaymentByCheckoutId(params.checkoutRequestId, (payment, order) => {
    // Already resolved — this is a duplicate delivery. Ignore it.
    if (payment.status !== 'initiated') return null;

    if (params.resultCode === 0) {
      payment.status = 'paid';
      payment.mpesaReceipt = params.receipt;
      payment.resultCode = 0;
      payment.resultDesc = params.resultDesc;
      paidAmount = payment.amount;
      return {
        // Flow A moves the order to paid; a COD order stays in its delivery
        // state — payment at handover does not change where the goods are.
        orderStatus:
          order.paymentOption === 'pay_now' ? ('paid' as const) : undefined,
        event: {
          actor: 'system',
          event: 'payment:paid',
          note: `M-Pesa payment received${params.receipt ? ` — receipt ${params.receipt}` : ''} (via ${params.source})`,
        },
      };
    }

    const failure = mapResultCode(params.resultCode, params.resultDesc);
    payment.status = params.resultCode === 1032 ? 'cancelled' : 'failed';
    payment.resultCode = params.resultCode;
    payment.resultDesc = params.resultDesc;
    return {
      orderStatus:
        order.paymentOption === 'pay_now' ? ('payment_failed' as const) : undefined,
      event: {
        actor: 'system',
        event: `payment:${payment.status}`,
        note: `${failure.message} (code ${params.resultCode}, via ${params.source})`,
      },
    };
  });

  /**
   * The receipt. Raised only when this call is the one that actually resolved
   * the payment — `applied` is false for a duplicate callback, which Daraja
   * sends routinely, and for the status-query fallback arriving after the
   * callback already landed. That guard is what stops a customer being emailed
   * the same receipt twice for one purchase.
   *
   * Not awaited: Daraja judges this endpoint by how fast it answers, and a
   * slow acknowledgement earns a retry. The money is already banked.
   */
  if (result.applied && result.order && paidAmount != null) {
    const order = result.order;
    const amount = paidAmount;
    void notifyPaymentReceived(order, { amount, mpesaReceipt: params.receipt ?? null }).catch(
      (error) =>
        console.error(
          `Receipt notification failed for ${order.orderNumber}:`,
          (error as Error).message
        )
    );
  }

  return result;
}

export async function applyCallback(parsed: ParsedCallback): Promise<void> {
  await applyOutcome({
    checkoutRequestId: parsed.checkoutRequestId,
    resultCode: parsed.resultCode,
    resultDesc: parsed.resultDesc,
    receipt: parsed.mpesaReceipt,
    source: 'callback',
  });
}

/**
 * The missing-callback fallback (MASTERPLAN 10.3 step 7). Kenyan networks
 * drop callbacks; without this a completed payment reads as a failure. Run
 * this before declaring any push failed.
 */
export async function resolveViaStatusQuery(checkoutRequestId: string): Promise<boolean> {
  const status = await queryTransactionStatus(checkoutRequestId);
  if (!status.ok) return false;

  await logMpesa({
    direction: 'query',
    endpoint: 'fallback-resolution',
    checkoutRequestId,
    payload: { resultCode: status.resultCode, resultDesc: status.resultDesc },
  });

  const applied = await applyOutcome({
    checkoutRequestId,
    resultCode: status.resultCode,
    resultDesc: status.resultDesc,
    // A status query does not return the receipt number; the callback or the
    // client's M-Pesa statement carries it. Recorded as resolved-by-query so
    // reconciliation knows to look it up.
    source: 'query',
  });
  return applied.applied;
}

/** Mark a stuck push as timed out after the fallback also failed to resolve it. */
export async function markTimedOut(checkoutRequestId: string): Promise<void> {
  await applyOutcome({
    checkoutRequestId,
    resultCode: 1037,
    resultDesc: 'No response from the phone, and the status query did not resolve',
    source: 'query',
  });
}

export async function markDelivered(orderNumber: string, actor: string): Promise<OrderRecord> {
  return updateOrderStatus(orderNumber, 'delivered', actor, 'Handed over to the customer');
}
