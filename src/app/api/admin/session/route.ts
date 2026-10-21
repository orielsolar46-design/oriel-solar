import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSessionToken,
  isAdminConfigured,
  sessionCookieName,
  sessionMaxAge,
} from '@/lib/admin/session';

/** Staff sign-in and sign-out. */
export const dynamic = 'force-dynamic';

const schema = z.object({ passphrase: z.string().min(1).max(200) });

// Crude in-process throttle: 8 sign-in attempts per IP per 10 minutes.
const attempts = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 8;

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Staff access is not configured on this deployment.' },
      { status: 503 }
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= MAX) {
    attempts.set(ip, recent);
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Wait ten minutes and try again.' },
      { status: 429 }
    );
  }
  attempts.set(ip, [...recent, now]);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Enter the staff passphrase' }, { status: 400 });
  }

  const token = createSessionToken(parsed.data.passphrase);
  if (!token) {
    return NextResponse.json({ ok: false, error: 'That passphrase is not right.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAge(),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), '', { path: '/', maxAge: 0 });
  return response;
}
