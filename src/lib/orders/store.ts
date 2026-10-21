import 'server-only';
import { serviceClient } from '@/lib/supabase';
import { orderNotification, sendPushToStaff } from '@/lib/push/send';
import { notifyOrderStatus } from '@/lib/orders/notifications';

/**
 * Order persistence, backed by Supabase.
 *
 * Uses the service-role client: orders, payments and events are never readable
 * by the browser under RLS, and every read here happens either behind the
 * staff gate or behind the customer's per-order access token.
 *
 * The COD rule — a pay_on_delivery order can never reach 'delivered' without a
 * paid payment row — is enforced by a database trigger AND re-checked here, so
 * the guarantee holds even if a future caller bypasses this module.
 */

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'payment_failed'
  | 'pending_cod'
  | 'processing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderLine = {
  slug: string;
  productName: string;
  modelCode: string | null;
  unitPrice: number;
  quantity: number;
  withInstallation: boolean;
};

export type OrderEvent = { actor: string; event: string; note?: string; at: string };

export type PaymentRecord = {
  id: string;
  status: 'initiated' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  phone: string;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  mpesaReceipt?: string;
  resultCode?: number;
  resultDesc?: string;
  amountChangeReason?: string;
  actor?: string;
  at: string;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  accessToken: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string | null;
  county: string;
  town: string | null;
  deliveryNotes: string | null;
  isBusiness: boolean;
  companyName: string | null;
  kraPin: string | null;
  deliveryMethod: 'delivery' | 'collection';
  deliveryFee: number | null;
  installationRequested: boolean;
  subtotal: number;
  total: number;
  paymentOption: 'pay_now' | 'pay_on_delivery';
  lines: OrderLine[];
  events: OrderEvent[];
  payments: PaymentRecord[];
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

type OrderRow = Record<string, unknown>;

function toRecord(
  order: OrderRow,
  items: OrderRow[],
  payments: OrderRow[],
  events: OrderRow[]
): OrderRecord {
  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    accessToken: String(order.access_token),
    status: order.status as OrderStatus,
    customerName: String(order.customer_name),
    phone: String(order.phone),
    email: (order.email as string) ?? null,
    county: String(order.county),
    town: (order.town as string) ?? null,
    deliveryNotes: (order.delivery_notes as string) ?? null,
    isBusiness: Boolean(order.is_business),
    companyName: (order.company_name as string) ?? null,
    kraPin: (order.kra_pin as string) ?? null,
    deliveryMethod: order.delivery_method as 'delivery' | 'collection',
    deliveryFee: order.delivery_fee == null ? null : Number(order.delivery_fee),
    installationRequested: Boolean(order.installation_requested),
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    paymentOption: order.payment_option as 'pay_now' | 'pay_on_delivery',
    lines: items.map((i) => ({
      slug: String(i.product_slug),
      productName: String(i.product_name),
      modelCode: (i.model_code as string) ?? null,
      unitPrice: Number(i.unit_price),
      quantity: Number(i.quantity),
      withInstallation: Boolean(i.with_installation),
    })),
    payments: payments
      .map((p) => ({
        id: String(p.id),
        status: p.status as PaymentRecord['status'],
        amount: Number(p.amount),
        phone: String(p.phone),
        checkoutRequestId: (p.checkout_request_id as string) ?? undefined,
        merchantRequestId: (p.merchant_request_id as string) ?? undefined,
        mpesaReceipt: (p.mpesa_receipt as string) ?? undefined,
        resultCode: p.result_code == null ? undefined : Number(p.result_code),
        resultDesc: (p.result_desc as string) ?? undefined,
        amountChangeReason: (p.amount_change_reason as string) ?? undefined,
        actor: (p.actor as string) ?? undefined,
        at: String(p.created_at),
      }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    events: events
      .map((e) => ({
        actor: String(e.actor),
        event: String(e.event),
        note: (e.note as string) ?? undefined,
        at: String(e.created_at),
      }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    createdAt: String(order.created_at),
  };
}

async function hydrate(orders: OrderRow[]): Promise<OrderRecord[]> {
  if (orders.length === 0) return [];
  const db = serviceClient();
  const ids = orders.map((o) => String(o.id));

  const [items, payments, events] = await Promise.all([
    db.from('order_items').select('*').in('order_id', ids),
    db.from('payments').select('*').in('order_id', ids),
    db.from('order_events').select('*').in('order_id', ids),
  ]);

  const byOrder = <T extends OrderRow>(rows: T[] | null) => {
    const map = new Map<string, T[]>();
    for (const row of rows ?? []) {
      const key = String(row.order_id);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return map;
  };

  const itemMap = byOrder((items.data as OrderRow[]) ?? []);
  const paymentMap = byOrder((payments.data as OrderRow[]) ?? []);
  const eventMap = byOrder((events.data as OrderRow[]) ?? []);

  return orders.map((o) =>
    toRecord(
      o,
      itemMap.get(String(o.id)) ?? [],
      paymentMap.get(String(o.id)) ?? [],
      eventMap.get(String(o.id)) ?? []
    )
  );
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function createOrder(
  input: Omit<OrderRecord, 'id' | 'orderNumber' | 'accessToken' | 'events' | 'payments' | 'createdAt'>
): Promise<OrderRecord> {
  const db = serviceClient();

  const { data: numberData, error: numberError } = await db.rpc('next_order_number');
  if (numberError) throw new Error(`Could not allocate an order number: ${numberError.message}`);
  const orderNumber = String(numberData);

  const { data: order, error } = await db
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: input.status,
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email,
      county: input.county,
      town: input.town,
      delivery_notes: input.deliveryNotes,
      is_business: input.isBusiness,
      company_name: input.companyName,
      kra_pin: input.kraPin,
      delivery_method: input.deliveryMethod,
      delivery_fee: input.deliveryFee,
      installation_requested: input.installationRequested,
      subtotal: input.subtotal,
      total: input.total,
      payment_option: input.paymentOption,
    })
    .select()
    .single();
  if (error || !order) throw new Error(`Could not create the order: ${error?.message}`);

  const orderId = String(order.id);

  if (input.lines.length > 0) {
    const { error: itemError } = await db.from('order_items').insert(
      input.lines.map((l) => ({
        order_id: orderId,
        product_slug: l.slug,
        product_name: l.productName,
        model_code: l.modelCode,
        unit_price: l.unitPrice,
        quantity: l.quantity,
        with_installation: l.withInstallation,
      }))
    );
    if (itemError) throw new Error(`Could not save the order items: ${itemError.message}`);
  }

  await db.from('order_events').insert({
    order_id: orderId,
    actor: 'customer',
    event: 'order_placed',
    note:
      input.paymentOption === 'pay_now'
        ? 'Order placed — M-Pesa payment to follow'
        : 'Order placed — pay on delivery by M-Pesa',
  });

  const created = (await getOrder(orderNumber))!;

  // Buzz the owner's phone. Deliberately not awaited into the failure path:
  // the order is already saved and the customer is already owed it, so a push
  // gateway having a bad day must never turn into a failed checkout.
  void sendPushToStaff(orderNotification(created)).catch((e) =>
    console.error('Order push failed:', (e as Error).message)
  );

  return created;
}

export async function getOrder(orderNumber: string): Promise<OrderRecord | undefined> {
  const { data } = await serviceClient()
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!data) return undefined;
  return (await hydrate([data as OrderRow]))[0];
}

/** All orders, newest first. Admin use only. */
export async function listOrders(): Promise<OrderRecord[]> {
  const { data } = await serviceClient()
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  return hydrate((data as OrderRow[]) ?? []);
}

export async function findOrderByPhone(
  orderNumber: string,
  phone: string
): Promise<OrderRecord | undefined> {
  const order = await getOrder(orderNumber);
  return order && order.phone === phone ? order : undefined;
}

export async function findOrderByCheckoutId(
  checkoutRequestId: string
): Promise<OrderRecord | undefined> {
  const { data: payment } = await serviceClient()
    .from('payments')
    .select('order_id')
    .eq('checkout_request_id', checkoutRequestId)
    .maybeSingle();
  if (!payment) return undefined;

  const { data: order } = await serviceClient()
    .from('orders')
    .select('*')
    .eq('id', payment.order_id)
    .maybeSingle();
  if (!order) return undefined;
  return (await hydrate([order as OrderRow]))[0];
}

export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  actor: string,
  note?: string
): Promise<OrderRecord> {
  const order = await getOrder(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found`);

  // Belt and braces: the database trigger enforces this too.
  if (
    status === 'delivered' &&
    order.paymentOption === 'pay_on_delivery' &&
    !order.payments.some((p) => p.status === 'paid')
  ) {
    throw new Error(`COD order ${orderNumber} cannot be delivered without a paid payment`);
  }

  const db = serviceClient();
  const { error } = await db.from('orders').update({ status }).eq('id', order.id);
  if (error) throw new Error(error.message);

  await db.from('order_events').insert({
    order_id: order.id,
    actor,
    event: `status:${status}`,
    note,
  });

  const updated = (await getOrder(orderNumber))!;

  /**
   * Tell the customer. Deliberately fixed here rather than at each call site:
   * this function is reached from the admin's status buttons AND from
   * markDelivered() in the M-Pesa flow, and a customer who hears about
   * "processing" but not about "delivered" because one route forgot to send is
   * exactly the kind of gap that only shows up in front of a real buyer.
   *
   * Not awaited into the failure path. The status change is already committed
   * and is the thing that mattered; an unreachable mail provider must not turn
   * a successful update into a 500 that invites staff to click the button
   * again.
   */
  void notifyOrderStatus(updated, status).catch((error) =>
    console.error(`Status notification failed for ${orderNumber}:`, (error as Error).message)
  );

  return updated;
}

export async function appendPayment(
  orderNumber: string,
  payment: Omit<PaymentRecord, 'id' | 'at'>
): Promise<OrderRecord> {
  const order = await getOrder(orderNumber);
  if (!order) throw new Error(`Order ${orderNumber} not found`);

  // Idempotency: checkout_request_id is unique in the database. A repeated
  // push with the same id never creates a second payment row.
  if (
    payment.checkoutRequestId &&
    order.payments.some((p) => p.checkoutRequestId === payment.checkoutRequestId)
  ) {
    return order;
  }

  const db = serviceClient();
  const { error } = await db.from('payments').insert({
    order_id: order.id,
    status: payment.status,
    amount: payment.amount,
    phone: payment.phone,
    checkout_request_id: payment.checkoutRequestId,
    merchant_request_id: payment.merchantRequestId,
    mpesa_receipt: payment.mpesaReceipt,
    result_code: payment.resultCode,
    result_desc: payment.resultDesc,
    amount_change_reason: payment.amountChangeReason,
    actor: payment.actor,
  });
  // A unique-violation here means a concurrent duplicate: treat as success.
  if (error && !error.message.includes('duplicate key')) {
    throw new Error(error.message);
  }

  await db.from('order_events').insert({
    order_id: order.id,
    actor: payment.actor ?? 'system',
    event: `payment:${payment.status}`,
    note:
      payment.status === 'initiated'
        ? `M-Pesa request sent to ${payment.phone} for KES ${payment.amount.toLocaleString('en-KE')}${payment.amountChangeReason ? ` (amount changed: ${payment.amountChangeReason})` : ''}`
        : undefined,
  });

  return (await getOrder(orderNumber))!;
}

/**
 * Apply a transition to the payment identified by its CheckoutRequestID.
 * The mutator returns null to mean "already resolved, ignore" — the guard
 * that makes duplicate Daraja callbacks harmless.
 */
export async function updatePaymentByCheckoutId(
  checkoutRequestId: string,
  mutate: (
    payment: PaymentRecord,
    order: OrderRecord
  ) => { orderStatus?: OrderStatus; event: Omit<OrderEvent, 'at'> } | null
): Promise<{ applied: boolean; order?: OrderRecord }> {
  const order = await findOrderByCheckoutId(checkoutRequestId);
  if (!order) return { applied: false };

  const payment = order.payments.find((p) => p.checkoutRequestId === checkoutRequestId)!;
  const draft: PaymentRecord = { ...payment };
  const outcome = mutate(draft, order);
  if (outcome === null) return { applied: false, order };

  const db = serviceClient();
  const { error } = await db
    .from('payments')
    .update({
      status: draft.status,
      mpesa_receipt: draft.mpesaReceipt,
      result_code: draft.resultCode,
      result_desc: draft.resultDesc,
    })
    .eq('checkout_request_id', checkoutRequestId);
  if (error) throw new Error(error.message);

  if (outcome.orderStatus) {
    await db.from('orders').update({ status: outcome.orderStatus }).eq('id', order.id);
  }
  await db.from('order_events').insert({
    order_id: order.id,
    actor: outcome.event.actor,
    event: outcome.event.event,
    note: outcome.event.note,
  });

  return { applied: true, order: await getOrder(order.orderNumber) };
}
