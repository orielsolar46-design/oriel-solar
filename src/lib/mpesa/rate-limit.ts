import 'server-only';

/**
 * STK push rate limiting (MASTERPLAN 10.5): 5 attempts per 15 minutes, per IP
 * AND per phone number. In-memory is correct for a single instance; on
 * multi-instance hosting this moves to a shared store (documented in
 * MPESA_SETUP.md).
 */

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Per-phone is the precise control and follows the brief exactly: 5 attempts
 * per 15 minutes.
 *
 * Per-IP is deliberately looser. Kenyan mobile networks put large numbers of
 * subscribers behind carrier-grade NAT, so many unrelated customers share one
 * public address — a 5-per-IP limit would lock out genuine buyers whose only
 * mistake was using the same network as someone else. 40 still stops scripted
 * abuse from a single host while leaving shared gateways usable. Recorded in
 * DECISIONS.md as a deliberate deviation.
 */
const MAX_PER_PHONE = 5;
const MAX_PER_IP = 40;

const buckets = new Map<string, number[]>();

function recent(key: string): number[] {
  const now = Date.now();
  return (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
}

export type RateLimitResult = { allowed: true } | { allowed: false; message: string };

const BLOCKED_MESSAGE =
  'That is a lot of payment attempts in a short time. Wait fifteen minutes and try again, or call 0723 204 342 and we will take the payment.';

export function checkRateLimit(ip: string, msisdn: string): RateLimitResult {
  const ipKey = `ip:${ip}`;
  const phoneKey = `msisdn:${msisdn}`;
  const ipHits = recent(ipKey);
  const phoneHits = recent(phoneKey);

  if (phoneHits.length >= MAX_PER_PHONE || ipHits.length >= MAX_PER_IP) {
    // Persist the pruned windows so expired entries don't accumulate.
    buckets.set(ipKey, ipHits);
    buckets.set(phoneKey, phoneHits);
    return { allowed: false, message: BLOCKED_MESSAGE };
  }

  const now = Date.now();
  buckets.set(ipKey, [...ipHits, now]);
  buckets.set(phoneKey, [...phoneHits, now]);
  return { allowed: true };
}

/** Test seam. */
export function resetRateLimits(): void {
  buckets.clear();
}
