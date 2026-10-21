import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serviceClient } from '@/lib/supabase';

/**
 * Call-back request intake, stored in Supabase `contact_messages`.
 * Writes use the service role because RLS blocks anonymous inserts — the
 * validation above this line is what protects the table.
 */
export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?254|0)(7|1)\d{8}$/, 'Enter a valid Kenyan phone number'),
  county: z.string().trim().min(2).max(40),
  need: z.string().trim().min(2).max(80),
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
      { ok: false, error: 'Check the details and try again' },
      { status: 400 }
    );
  }

  const { error } = await serviceClient().from('contact_messages').insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    county: parsed.data.county,
    need: parsed.data.need,
  });

  if (error) {
    console.error('contact_messages insert failed:', error.message);
    return NextResponse.json(
      { ok: false, error: "We couldn't save that. Call us on 0723 204 342 instead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
