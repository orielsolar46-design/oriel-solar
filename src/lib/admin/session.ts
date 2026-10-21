import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

/**
 * Interim staff session (Stage 8).
 *
 * Supabase Auth with `admin` / `staff` roles is the target design and the
 * schema for it already exists (`staff_profiles` in
 * supabase/migrations/0001_schema.sql). Until the Supabase project is
 * provisioned, staff sign in with a shared passphrase (`ADMIN_STAFF_KEY`) and
 * receive an HMAC-signed, httpOnly session cookie.
 *
 * Deliberate properties:
 *  - the passphrase is never stored in the cookie, only a signed expiry;
 *  - comparisons are timing-safe;
 *  - everything refuses to work when ADMIN_STAFF_KEY is unset, so the admin
 *    can never be accidentally open.
 */

const COOKIE = 'oriel_staff';
const MAX_AGE_SECONDS = 60 * 60 * 12; // a working day

function secret(): string | null {
  const key = process.env.ADMIN_STAFF_KEY;
  return key && key.length >= 8 ? key : null;
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function isAdminConfigured(): boolean {
  return secret() !== null;
}

/** Verify the sign-in passphrase and mint a session token. */
export function createSessionToken(passphrase: string): string | null {
  const key = secret();
  if (!key) return null;
  if (!safeEqual(passphrase, key)) return null;
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload, key)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  const key = secret();
  if (!key || !token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload, key))) return false;
  const expires = Number.parseInt(payload, 10);
  return Number.isFinite(expires) && Date.now() < expires;
}

export function sessionCookieName(): string {
  return COOKIE;
}

export function sessionMaxAge(): number {
  return MAX_AGE_SECONDS;
}

/** Server-component guard: true when the caller holds a valid staff session. */
export function isStaffAuthenticated(): boolean {
  return verifySessionToken(cookies().get(COOKIE)?.value);
}
