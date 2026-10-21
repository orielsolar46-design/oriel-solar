import { z } from 'zod';

/**
 * What the back office is allowed to send when writing an invoice or receipt.
 *
 * Totals are absent on purpose. The server recomputes them from the lines on
 * every write — the same rule the order API follows for prices, for the same
 * reason: a figure the browser supplied is a figure someone can change.
 */

const line = z.object({
  description: z.string().trim().min(1, 'Describe the item').max(120),
  quantity: z.number().int().min(1).max(9999),
  // Null is meaningful, not missing: it prints an em dash, which is what the
  // pad does for a line like "Installation (Materials & Labour)".
  unitPrice: z.number().min(0).max(100_000_000).nullable(),
  amount: z.number().min(-100_000_000).max(100_000_000),
});

export const documentSchema = z.object({
  docType: z.enum(['invoice', 'receipt']),
  customerName: z.string().trim().min(2, 'Who is this for?').max(120),
  // A counter sale often has nothing but a name, so everything else is
  // optional. Refusing to issue a receipt without an email address would stop
  // the till working for exactly the customers this feature exists to serve.
  customerPhone: z.string().trim().max(30).optional().or(z.literal('')),
  customerEmail: z
    .string()
    .trim()
    .email('That does not look like an email address')
    .optional()
    .or(z.literal('')),
  customerAddress: z.string().trim().max(160).optional().or(z.literal('')),
  kraPin: z.string().trim().max(20).optional().or(z.literal('')),
  goodsCategories: z.array(z.string()).max(12).default([]),
  lines: z.array(line).min(1, 'Add at least one line').max(40),
  vatMode: z.enum(['exclusive', 'inclusive', 'none']).default('exclusive'),
  vatRate: z.number().min(0).max(100).default(16),
  amountPaid: z.number().min(0).max(100_000_000).default(0),
  paymentMethod: z.enum(['cash', 'mpesa', 'bank_transfer', 'cheque']).nullable().default(null),
  mpesaTill: z.string().trim().max(20).optional().or(z.literal('')),
  mpesaCode: z.string().trim().max(30).optional().or(z.literal('')),
  bankRef: z.string().trim().max(60).optional().or(z.literal('')),
  receivedBy: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(600).optional().or(z.literal('')),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
    .optional()
    .or(z.literal('')),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;

export const sendSchema = z.object({
  to: z.string().trim().email('That does not look like an email address'),
  note: z.string().trim().max(600).optional().or(z.literal('')),
});

export const paymentSchema = z.object({
  amount: z.number().min(0.01, 'How much came in?').max(100_000_000),
  method: z.enum(['cash', 'mpesa', 'bank_transfer', 'cheque']).nullable().default(null),
  mpesaCode: z.string().trim().max(30).optional().or(z.literal('')),
  mpesaTill: z.string().trim().max(20).optional().or(z.literal('')),
  bankRef: z.string().trim().max(60).optional().or(z.literal('')),
  receivedBy: z.string().trim().max(80).optional().or(z.literal('')),
});

export const voidSchema = z.object({
  reason: z.string().trim().min(4, 'Say why — this is a permanent record').max(200),
});
