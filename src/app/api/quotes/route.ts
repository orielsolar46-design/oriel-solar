import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normaliseMsisdn } from '@/lib/checkout-schema';
import { serviceClient } from '@/lib/supabase';

/**
 * Quotation requests, site-survey bookings and warranty registrations — one
 * intake distinguished by `kind`, stored in Supabase `quote_requests` so staff
 * work a single queue in /admin/quotes.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  kind: z.enum(['quote', 'survey', 'warranty']),
  name: z.string().trim().min(2, 'Enter your name').max(160),
  phone: z.string().trim().refine((v) => normaliseMsisdn(v) !== null, {
    message: "Check it's the right Kenyan number",
  }),
  email: z.string().trim().email('Check the email address').max(200).optional().or(z.literal('')),
  county: z.string().trim().max(60).optional().or(z.literal('')),
  productSlug: z.string().trim().max(200).optional().or(z.literal('')),
  orderNumber: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional().or(z.literal('')),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the details and try again' },
      { status: 400 }
    );
  }

  const { kind, name, email, county, productSlug, orderNumber, message } = parsed.data;

  // The order number and request kind ride in the note thread, so a single
  // table serves all three intake types without schema churn.
  const notes = [
    { at: new Date().toISOString(), by: 'system', text: `Request type: ${kind}` },
    ...(orderNumber ? [{ at: new Date().toISOString(), by: 'system', text: `Order: ${orderNumber}` }] : []),
  ];

  const { error } = await serviceClient().from('quote_requests').insert({
    name,
    phone: normaliseMsisdn(parsed.data.phone),
    email: email || null,
    county: county || null,
    product_slug: productSlug || null,
    message: message || null,
    notes,
  });

  if (error) {
    console.error('quote_requests insert failed:', error.message);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that. Call 0723 204 342 and we will take the details." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
