import 'server-only';
import { serviceClient } from '@/lib/supabase';
import {
  computeTotals,
  round2,
  statusForPayment,
  type DocumentLine,
  type DocumentRecord,
  type DocumentStatus,
  type DocumentType,
  type PaymentMethod,
  type VatMode,
} from '@/lib/documents/types';

/**
 * Invoice and receipt persistence.
 *
 * Every write recomputes the totals from the lines rather than trusting what
 * the caller sent. The admin form does the same arithmetic as it types so the
 * clerk sees the right figures, but the browser's numbers are a preview and
 * never the record — the same rule the order API already follows for prices.
 */

type Row = Record<string, unknown>;

function toRecord(row: Row): DocumentRecord {
  const order = row.orders as { order_number?: string } | null | undefined;
  return {
    id: String(row.id),
    docType: row.doc_type as DocumentType,
    docNumber: (row.doc_number as string) ?? null,
    status: row.status as DocumentStatus,
    source: (row.source as DocumentRecord['source']) ?? 'walk_in',
    orderId: (row.order_id as string) ?? null,
    orderNumber: order?.order_number ?? null,
    accessToken: String(row.access_token),

    customerName: String(row.customer_name),
    customerPhone: (row.customer_phone as string) ?? null,
    customerEmail: (row.customer_email as string) ?? null,
    customerAddress: (row.customer_address as string) ?? null,
    kraPin: (row.kra_pin as string) ?? null,

    goodsCategories: (row.goods_categories as string[]) ?? [],
    lines: ((row.lines as DocumentLine[]) ?? []).map((line) => ({
      description: String(line.description ?? ''),
      quantity: Number(line.quantity) || 0,
      unitPrice: line.unitPrice == null ? null : Number(line.unitPrice),
      amount: Number(line.amount) || 0,
    })),

    vatMode: (row.vat_mode as VatMode) ?? 'exclusive',
    vatRate: Number(row.vat_rate ?? 16),
    subtotal: Number(row.subtotal ?? 0),
    vatAmount: Number(row.vat_amount ?? 0),
    total: Number(row.total ?? 0),
    amountPaid: Number(row.amount_paid ?? 0),
    balance: Number(row.balance ?? 0),

    paymentMethod: (row.payment_method as PaymentMethod) ?? null,
    mpesaTill: (row.mpesa_till as string) ?? null,
    mpesaCode: (row.mpesa_code as string) ?? null,
    bankRef: (row.bank_ref as string) ?? null,

    receivedBy: (row.received_by as string) ?? null,
    notes: (row.notes as string) ?? null,
    dueDate: (row.due_date as string) ?? null,

    issuedAt: (row.issued_at as string) ?? null,
    lastSentAt: (row.last_sent_at as string) ?? null,
    lastSentTo: (row.last_sent_to as string) ?? null,
    createdAt: String(row.created_at),
  };
}

/** Everything a caller may set. Totals and the number are never among them. */
export type DocumentInput = {
  docType: DocumentType;
  source?: DocumentRecord['source'];
  orderId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  kraPin?: string | null;
  goodsCategories?: string[];
  lines: DocumentLine[];
  vatMode?: VatMode;
  vatRate?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod | null;
  mpesaTill?: string | null;
  mpesaCode?: string | null;
  bankRef?: string | null;
  receivedBy?: string | null;
  notes?: string | null;
  dueDate?: string | null;
};

/**
 * Normalise the lines before they are stored.
 *
 * `amount` is honoured when the caller supplies one — that is how a negotiated
 * line total survives — and derived from quantity x unit price when they do
 * not, which is what the admin form relies on for the ordinary case.
 */
function normaliseLines(lines: DocumentLine[]): DocumentLine[] {
  return lines
    .filter((line) => line.description?.trim())
    .map((line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = line.unitPrice == null ? null : round2(Number(line.unitPrice) || 0);
      const amount =
        line.amount == null || Number.isNaN(Number(line.amount))
          ? round2(quantity * (unitPrice ?? 0))
          : round2(Number(line.amount));
      return { description: line.description.trim(), quantity, unitPrice, amount };
    });
}

function toColumns(input: DocumentInput) {
  const lines = normaliseLines(input.lines);
  const vatMode = input.vatMode ?? 'exclusive';
  const vatRate = input.vatRate ?? 16;
  const amountPaid = round2(input.amountPaid ?? 0);
  const totals = computeTotals(lines, vatMode, vatRate, amountPaid);

  return {
    doc_type: input.docType,
    source: input.source ?? 'walk_in',
    order_id: input.orderId ?? null,
    customer_name: input.customerName.trim(),
    customer_phone: input.customerPhone?.trim() || null,
    customer_email: input.customerEmail?.trim().toLowerCase() || null,
    customer_address: input.customerAddress?.trim() || null,
    kra_pin: input.kraPin?.trim() || null,
    goods_categories: input.goodsCategories ?? [],
    lines,
    vat_mode: vatMode,
    vat_rate: vatRate,
    subtotal: totals.subtotal,
    vat_amount: totals.vatAmount,
    total: totals.total,
    amount_paid: amountPaid,
    balance: totals.balance,
    payment_method: input.paymentMethod ?? null,
    mpesa_till: input.mpesaTill?.trim() || null,
    mpesa_code: input.mpesaCode?.trim().toUpperCase() || null,
    bank_ref: input.bankRef?.trim() || null,
    received_by: input.receivedBy?.trim() || null,
    notes: input.notes?.trim() || null,
    due_date: input.dueDate || null,
  };
}

const SELECT = '*, orders(order_number)';

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  const { data } = await serviceClient().from('documents').select(SELECT).eq('id', id).maybeSingle();
  return data ? toRecord(data as Row) : undefined;
}

export async function getDocumentByNumber(
  docNumber: string
): Promise<DocumentRecord | undefined> {
  const { data } = await serviceClient()
    .from('documents')
    .select(SELECT)
    .eq('doc_number', docNumber)
    .maybeSingle();
  return data ? toRecord(data as Row) : undefined;
}

export async function listDocuments(options?: {
  docType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  limit?: number;
}): Promise<DocumentRecord[]> {
  let query = serviceClient()
    .from('documents')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 300);

  if (options?.docType) query = query.eq('doc_type', options.docType);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    // Number, name and phone are the three things a clerk actually has to
    // hand when someone rings about a receipt.
    query = query.or(
      `doc_number.ilike.${term},customer_name.ilike.${term},customer_phone.ilike.${term}`
    );
  }

  const { data } = await query;
  return ((data as Row[]) ?? []).map(toRecord);
}

/** Every document raised against an order, oldest first. */
export async function documentsForOrder(orderId: string): Promise<DocumentRecord[]> {
  const { data } = await serviceClient()
    .from('documents')
    .select(SELECT)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  return ((data as Row[]) ?? []).map(toRecord);
}

/**
 * Whether an order already has a document of this type.
 *
 * The guard against sending two receipts for one payment. Daraja retries its
 * callbacks, and although the payment itself is idempotent, the email that
 * follows it must be too — a customer receiving three receipts for one purchase
 * assumes they have been charged three times.
 */
export async function orderHasDocument(orderId: string, docType: DocumentType): Promise<boolean> {
  const { count } = await serviceClient()
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
    .eq('doc_type', docType)
    .neq('status', 'void');
  return (count ?? 0) > 0;
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                      */
/* -------------------------------------------------------------------------- */

export async function createDocument(
  input: DocumentInput,
  options?: { issue?: boolean }
): Promise<DocumentRecord> {
  const columns = toColumns(input);
  const db = serviceClient();

  const { data, error } = await db
    .from('documents')
    .insert({ ...columns, status: 'draft' })
    .select(SELECT)
    .single();
  if (error || !data) throw new Error(`Could not save the document: ${error?.message}`);

  const created = toRecord(data as Row);
  return options?.issue ? issueDocument(created.id) : created;
}

export async function updateDocument(
  id: string,
  input: DocumentInput
): Promise<DocumentRecord> {
  const existing = await getDocument(id);
  if (!existing) throw new Error('Document not found');
  if (existing.status === 'void') throw new Error('A void document cannot be edited');

  const columns = toColumns(input);
  const db = serviceClient();

  // An issued document keeps its status in step with what has been paid; a
  // draft stays a draft until someone issues it.
  const status: DocumentStatus =
    existing.status === 'draft'
      ? 'draft'
      : statusForPayment(Number(columns.total), Number(columns.amount_paid));

  const { error } = await db.from('documents').update({ ...columns, status }).eq('id', id);
  if (error) throw new Error(`Could not update the document: ${error.message}`);
  return (await getDocument(id))!;
}

/**
 * Allocate a number and put the document into circulation.
 *
 * Issuing twice is a no-op rather than an error: the admin's "issue and email"
 * button can be pressed twice on a slow connection, and burning a second
 * number for the same sale would be worse than doing nothing.
 */
export async function issueDocument(id: string): Promise<DocumentRecord> {
  const existing = await getDocument(id);
  if (!existing) throw new Error('Document not found');
  if (existing.docNumber) return existing;

  const db = serviceClient();
  const { data: number, error: numberError } = await db.rpc('next_document_number', {
    p_type: existing.docType,
  });
  if (numberError || !number) {
    throw new Error(`Could not allocate a document number: ${numberError?.message}`);
  }

  const { error } = await db
    .from('documents')
    .update({
      doc_number: String(number),
      status: statusForPayment(existing.total, existing.amountPaid),
      issued_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`Could not issue the document: ${error.message}`);

  return (await getDocument(id))!;
}

/**
 * Record a payment against an issued invoice.
 *
 * Deliberately additive — `amount` is added to what has already been paid, so
 * a deposit followed by a balance leaves the right figure without the caller
 * having to read the row first and risk two clerks overwriting each other.
 */
export async function recordDocumentPayment(
  id: string,
  payment: {
    amount: number;
    method?: PaymentMethod | null;
    mpesaCode?: string | null;
    mpesaTill?: string | null;
    bankRef?: string | null;
    receivedBy?: string | null;
  }
): Promise<DocumentRecord> {
  const existing = await getDocument(id);
  if (!existing) throw new Error('Document not found');
  if (existing.status === 'void') throw new Error('A void document cannot take a payment');

  const amountPaid = round2(existing.amountPaid + (Number(payment.amount) || 0));
  const db = serviceClient();

  const { error } = await db
    .from('documents')
    .update({
      amount_paid: amountPaid,
      balance: round2(existing.total - amountPaid),
      status: statusForPayment(existing.total, amountPaid),
      payment_method: payment.method ?? existing.paymentMethod,
      mpesa_code: payment.mpesaCode?.trim().toUpperCase() || existing.mpesaCode,
      mpesa_till: payment.mpesaTill?.trim() || existing.mpesaTill,
      bank_ref: payment.bankRef?.trim() || existing.bankRef,
      received_by: payment.receivedBy?.trim() || existing.receivedBy,
    })
    .eq('id', id);
  if (error) throw new Error(`Could not record the payment: ${error.message}`);

  return (await getDocument(id))!;
}

/**
 * Cancel an issued document.
 *
 * The row and its number stay: a numbered series with a hole in it and no
 * explanation is what an auditor asks awkward questions about. The PDF prints
 * VOID across the face so a reprint can never pass for a live document.
 */
export async function voidDocument(id: string, reason: string): Promise<DocumentRecord> {
  const existing = await getDocument(id);
  if (!existing) throw new Error('Document not found');

  const note = [existing.notes, `VOID: ${reason.trim()}`].filter(Boolean).join('\n');
  const { error } = await serviceClient()
    .from('documents')
    .update({ status: 'void', notes: note })
    .eq('id', id);
  if (error) throw new Error(`Could not void the document: ${error.message}`);

  return (await getDocument(id))!;
}

/** Stamp when and where a document was last emailed. */
export async function recordDocumentSent(id: string, to: string): Promise<void> {
  await serviceClient()
    .from('documents')
    .update({ last_sent_at: new Date().toISOString(), last_sent_to: to })
    .eq('id', id);
}

/** Create a draft that already carries its number and is ready to send. */
export async function createIssuedDocument(input: DocumentInput): Promise<DocumentRecord> {
  return createDocument(input, { issue: true });
}
