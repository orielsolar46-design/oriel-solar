import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { renderDocumentPdf, documentFilename } from '@/lib/documents/pdf';
import { invoiceFromOrder, receiptFromOrder } from '@/lib/documents/from-order';
import {
  createIssuedDocument,
  documentsForOrder,
  orderHasDocument,
  recordDocumentSent,
} from '@/lib/documents/store';
import { sendEmail, staffAddress } from '@/lib/email/client';
import {
  orderPlacedEmail,
  orderStatusEmail,
  paymentReceivedEmail,
  staffOrderEmail,
} from '@/lib/email/templates';
import type { DocumentRecord } from '@/lib/documents/types';
import type { OrderRecord, OrderStatus } from '@/lib/orders/store';

/**
 * Order notifications (MASTERPLAN Section 9 table).
 *
 * Email now goes out through Resend and carries the PDF the customer keeps:
 * an invoice when the order is placed, a receipt when the money lands, and a
 * plain progress note at each step in between.
 *
 * SMS still has no transport. Africa's Talking is not wired up, so those
 * messages continue to be written to a git-ignored file where the copy can be
 * reviewed exactly as customers will receive it. That is unchanged from before
 * and is not what this module is for.
 *
 * NOTHING HERE IS ALLOWED TO THROW. Every entry point is wrapped, because each
 * of them is called from inside a request that has already done the thing that
 * matters — taken an order, banked a payment, moved a status. A mail provider
 * having a bad afternoon must never undo that.
 */

const SMS_STORE = path.join(process.cwd(), 'data', 'dev-notifications.json');

type LoggedSms = { channel: 'sms'; to: string; body: string; at: string };

async function recordSms(entries: LoggedSms[]): Promise<void> {
  try {
    let existing: LoggedSms[] = [];
    try {
      existing = JSON.parse(await fs.readFile(SMS_STORE, 'utf-8'));
    } catch {
      // first notification
    }
    existing.push(...entries);
    await fs.writeFile(SMS_STORE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch {
    // Notification logging must never fail an order. On Vercel the filesystem
    // is read-only and this is expected to do nothing at all.
  }
}

function kes(n: number): string {
  return `KES ${n.toLocaleString('en-KE')}`;
}

/**
 * SMS bodies must stay inside the GSM-7 alphabet. A single non-GSM character
 * (an em dash, curly quote or ×) switches the whole message to UCS-2, which
 * cuts the segment length from 160 characters to 70 and multiplies the cost
 * of every order notification. Keep SMS copy plain ASCII.
 */
function gsm7(text: string): string {
  return text
    .replace(/[—–]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/×/g, 'x')
    .replace(/…/g, '...');
}

/* -------------------------------------------------------------------------- */
/* Attachments                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Render the customer's copy for attaching.
 *
 * Only the ORIGINAL goes to the customer — the duplicate is the office copy
 * and there is no reason to email someone a page marked "office copy". Staff
 * download the duplicate, or the two-up sheet, from the back office.
 */
async function customerCopy(doc: DocumentRecord) {
  return {
    filename: documentFilename(doc, 'original'),
    content: await renderDocumentPdf(doc, 'original'),
  };
}

/* -------------------------------------------------------------------------- */
/* Order placed                                                                */
/* -------------------------------------------------------------------------- */

export async function notifyOrderPlaced(order: OrderRecord): Promise<void> {
  const payNow = order.paymentOption === 'pay_now';

  // SMS first: it is the channel every Kenyan customer certainly has, and it
  // does not depend on anything above being reachable.
  const smsBody = payNow
    ? `Oriel Power: order ${order.orderNumber} received, total ${kes(order.total)}. Approve the M-Pesa request on your phone to complete payment.`
    : `Oriel Power: order ${order.orderNumber} confirmed, total ${kes(order.total)}. Payment is by M-Pesa on delivery - our team sends the request to this phone at handover. No cash needed.`;
  await recordSms([
    { channel: 'sms', to: order.phone, body: gsm7(smsBody), at: new Date().toISOString() },
  ]);

  // The invoice. Raised for every order including pay-on-delivery, which is
  // the case that needs it most: that customer is being asked to have money
  // ready at the gate and deserves a written statement of how much, first.
  let invoice: DocumentRecord | null = null;
  try {
    if (!(await orderHasDocument(order.id, 'invoice'))) {
      invoice = await createIssuedDocument(await invoiceFromOrder(order));
    }
  } catch (error) {
    console.error(`[notify] could not raise an invoice for ${order.orderNumber}:`, error);
  }

  if (order.email) {
    try {
      const message = orderPlacedEmail(order);
      const attachments = invoice ? [await customerCopy(invoice)] : undefined;
      const result = await sendEmail({
        to: order.email,
        ...message,
        template: 'order_placed',
        attachments,
        orderId: order.id,
        documentId: invoice?.id ?? null,
      });
      if (invoice && result.status === 'sent') await recordDocumentSent(invoice.id, order.email);
    } catch (error) {
      console.error(`[notify] order-placed email failed for ${order.orderNumber}:`, error);
    }
  }

  try {
    await sendEmail({
      to: staffAddress(),
      ...staffOrderEmail(order),
      template: 'staff_new_order',
      orderId: order.id,
    });
  } catch (error) {
    console.error(`[notify] staff email failed for ${order.orderNumber}:`, error);
  }
}

/* -------------------------------------------------------------------------- */
/* Payment received                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Raise and send the receipt once money has arrived.
 *
 * Guarded against duplicates at the document level rather than the email
 * level: Daraja retries callbacks, and while the payment itself is already
 * idempotent, a customer who receives three receipts for one purchase will
 * reasonably assume they have been charged three times.
 */
export async function notifyPaymentReceived(
  order: OrderRecord,
  payment: { amount: number; mpesaReceipt?: string | null }
): Promise<void> {
  let receipt: DocumentRecord | null = null;
  try {
    if (await orderHasDocument(order.id, 'receipt')) return;
    receipt = await createIssuedDocument(await receiptFromOrder(order, payment));
  } catch (error) {
    console.error(`[notify] could not raise a receipt for ${order.orderNumber}:`, error);
  }

  await recordSms([
    {
      channel: 'sms',
      to: order.phone,
      body: gsm7(
        `Oriel Power: payment of ${kes(payment.amount)} received for order ${order.orderNumber}${
          payment.mpesaReceipt ? `, M-Pesa code ${payment.mpesaReceipt}` : ''
        }. Asante sana.`
      ),
      at: new Date().toISOString(),
    },
  ]);

  if (!order.email) return;

  try {
    const message = paymentReceivedEmail(order, payment);
    const attachments = receipt ? [await customerCopy(receipt)] : undefined;
    const result = await sendEmail({
      to: order.email,
      ...message,
      template: 'payment_received',
      attachments,
      orderId: order.id,
      documentId: receipt?.id ?? null,
    });
    if (receipt && result.status === 'sent') await recordDocumentSent(receipt.id, order.email);
  } catch (error) {
    console.error(`[notify] payment email failed for ${order.orderNumber}:`, error);
  }
}

/* -------------------------------------------------------------------------- */
/* Status changes                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Tell the customer their order has moved on.
 *
 * Called whenever staff change a status in the back office, so clicking
 * "Processing" is all anyone has to do — the customer hears about it without
 * a second action, which is the whole point. Statuses with no customer-facing
 * copy send nothing; see STATUS_COPY in the templates for which those are and
 * why.
 *
 * When the order is delivered and a receipt already exists, it rides along
 * with the message: that is the moment people file the paperwork, and it saves
 * them digging back through their inbox for the earlier email.
 */
export async function notifyOrderStatus(order: OrderRecord, status: OrderStatus): Promise<void> {
  const message = orderStatusEmail(order, status);
  if (!message) return;

  const smsBody: Partial<Record<OrderStatus, string>> = {
    processing: `Oriel Power: order ${order.orderNumber} is being prepared. We will let you know when it is on its way.`,
    out_for_delivery:
      order.paymentOption === 'pay_on_delivery'
        ? `Oriel Power: order ${order.orderNumber} is on its way. Have your M-Pesa ready - we send the request for ${kes(order.total)} at handover. No cash.`
        : `Oriel Power: order ${order.orderNumber} is on its way. Our team will ring when they are close.`,
    delivered: `Oriel Power: order ${order.orderNumber} delivered. Asante sana. Keep your receipt for any warranty claim.`,
    cancelled: `Oriel Power: order ${order.orderNumber} has been cancelled. Call 0723204342 if this is wrong.`,
    refunded: `Oriel Power: your refund for order ${order.orderNumber} has been processed to your M-Pesa.`,
    payment_failed: `Oriel Power: the M-Pesa payment for order ${order.orderNumber} did not go through. Nothing was charged. Open your order to try again.`,
  };

  if (smsBody[status]) {
    await recordSms([
      {
        channel: 'sms',
        to: order.phone,
        body: gsm7(smsBody[status] as string),
        at: new Date().toISOString(),
      },
    ]);
  }

  if (!order.email) return;

  try {
    let attachments;
    if (status === 'delivered') {
      const receipt = (await documentsForOrder(order.id)).find(
        (d) => d.docType === 'receipt' && d.status !== 'void'
      );
      if (receipt) attachments = [await customerCopy(receipt)];
    }

    await sendEmail({
      to: order.email,
      ...message,
      template: `status:${status}`,
      attachments,
      orderId: order.id,
    });
  } catch (error) {
    console.error(`[notify] status email failed for ${order.orderNumber}:`, error);
  }
}
