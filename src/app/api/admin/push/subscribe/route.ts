import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guardAdminWrite } from '@/lib/admin/guard';
import { serviceClient } from '@/lib/supabase';

/**
 * Register (or forget) a device for order notifications.
 *
 * Staff-guarded like every other admin write: a push subscription is a
 * broadcast channel into the owner's pocket, and an open endpoint here would
 * let anyone attach a device to it.
 */
export const dynamic = 'force-dynamic';

const subscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
  label: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const denied = guardAdminWrite(request);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'That subscription is not valid' }, { status: 400 });
  }

  // Upsert on endpoint: re-allowing notifications on a device the owner already
  // registered should refresh it, not accumulate duplicates that each buzz.
  const { error } = await serviceClient()
    .from('push_subscriptions')
    .upsert(
      {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        label: parsed.data.label ?? null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    const missing = error.message.includes('push_subscriptions');
    return NextResponse.json(
      {
        ok: false,
        error: missing
          ? 'Notifications are not enabled on the database yet — run migration 0004 in the Supabase SQL Editor.'
          : 'Could not save that subscription.',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const denied = guardAdminWrite(request);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const endpoint = (body as { endpoint?: string }).endpoint;
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: 'Nothing to remove' }, { status: 400 });
  }

  await serviceClient().from('push_subscriptions').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
