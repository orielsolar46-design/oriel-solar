import 'server-only';
import { headers } from 'next/headers';
import { isStaffAuthenticated } from '@/lib/admin/session';

/**
 * Shared gate for admin mutation routes.
 *
 * Three things, in the order they matter:
 *
 * 1. Session. Checked before a body is read, so an unauthenticated request
 *    never causes work.
 *
 * 2. Same-origin. The staff cookie is httpOnly and SameSite, which already
 *    stops the ordinary cross-site POST, but SameSite is a browser promise and
 *    these routes delete products. Origin is checked explicitly: a signed-in
 *    staff member visiting a hostile page must not be able to have their
 *    session used against the catalogue.
 *
 * 3. Rate. A shared passphrase means a leaked key is a working key, so the
 *    blast radius is capped — 60 writes a minute is far above what a person
 *    clicking buttons produces and far below what a script needs to be useful.
 *
 * In-process counters reset when the serverless instance recycles, so this is
 * a speed bump rather than a wall. Real per-user accounts and a database-backed
 * limit are the proper fix, and are noted in DECISIONS.md.
 */

const WINDOW_MS = 60_000;
const MAX_WRITES = 60;
const hits = new Map<string, number[]>();

export type GuardFailure = { status: number; error: string };

export function guardAdminWrite(request: Request): GuardFailure | null {
  if (!isStaffAuthenticated()) {
    return { status: 401, error: 'Not signed in' };
  }

  const h = headers();
  const origin = h.get('origin');
  if (origin) {
    const host = h.get('host');
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!host || originHost !== host) {
      return { status: 403, error: 'Cross-site request refused' };
    }
  }

  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_WRITES) {
    hits.set(ip, recent);
    return { status: 429, error: 'That is a lot of changes at once. Wait a minute.' };
  }
  hits.set(ip, [...recent, now]);
  return null;
}
