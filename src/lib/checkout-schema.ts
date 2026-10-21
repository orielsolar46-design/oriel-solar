import { z } from 'zod';

/**
 * Checkout validation, shared by the client form and the order API
 * (MASTERPLAN 7.6). The M-Pesa phone is normalised to 2547XXXXXXXX /
 * 2541XXXXXXXX — the number that will receive the payment request.
 *
 * There is no delivery zone. The buyer gives a county and describes the place
 * in their own words; the delivery charge is worked out when the goods are
 * delivered, so nothing on the storefront quotes a figure it cannot stand
 * behind. Only the goods are charged at checkout.
 */

/** Normalise 07XX/01XX/+2547XX/2547XX to 254XXXXXXXXX, or null if invalid. */
export function normaliseMsisdn(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let rest: string | null = null;
  if (/^254[71]\d{8}$/.test(digits)) rest = digits.slice(3);
  else if (/^0[71]\d{8}$/.test(digits)) rest = digits.slice(1);
  else if (/^[71]\d{8}$/.test(digits)) rest = digits;
  return rest ? `254${rest}` : null;
}

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, 'Enter your full name').max(160),
    phone: z
      .string()
      .trim()
      .refine((v) => normaliseMsisdn(v) !== null, {
        message: "Check it's the right M-Pesa number",
      }),
    email: z
      .string()
      .trim()
      .email('Check the email address')
      .max(200)
      .optional()
      .or(z.literal('')),
    // Required for delivery only, checked below — the fields are hidden when
    // the buyer is collecting, and a required field nobody can see is a form
    // that refuses to submit for no visible reason.
    county: z.string().trim().max(60).optional().or(z.literal('')),
    town: z.string().trim().max(160).optional().or(z.literal('')),
    deliveryNotes: z.string().trim().max(500).optional().or(z.literal('')),
    isBusiness: z.boolean(),
    companyName: z.string().trim().max(160).optional().or(z.literal('')),
    kraPin: z.string().trim().max(20).optional().or(z.literal('')),
    deliveryMethod: z.enum(['delivery', 'collection']),
    withInstallation: z.boolean(),
    paymentOption: z.enum(['pay_now', 'pay_on_delivery']),
    acceptTerms: z.literal(true, {
      message: 'You need to accept the terms to place the order',
    }),
  })
  .superRefine((v, ctx) => {
    if (v.isBusiness && !v.companyName) {
      ctx.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: 'Enter the company name',
      });
    }
    // Delivery needs a county AND somewhere within it — a driver cannot find
    // "Nakuru". Collection needs neither.
    if (v.deliveryMethod === 'delivery') {
      if (!v.county) {
        ctx.addIssue({ code: 'custom', path: ['county'], message: 'Choose your county' });
      }
      if (!v.town) {
        ctx.addIssue({
          code: 'custom',
          path: ['town'],
          message: 'Tell us the town, estate or landmark so the driver can find you',
        });
      }
    }
  });

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const orderRequestSchema = z.object({
  details: checkoutSchema,
  lines: z
    .array(
      z.object({
        slug: z.string().min(1).max(200),
        quantity: z.number().int().min(1).max(999),
        withInstallation: z.boolean().optional(),
      })
    )
    .min(1, 'The basket is empty')
    .max(60),
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
