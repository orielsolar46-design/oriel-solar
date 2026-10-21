import 'server-only';
import { serviceClient } from '@/lib/supabase';

/**
 * M-Pesa request/response logging (MASTERPLAN 10.5). Every Daraja exchange is
 * recorded in Supabase `mpesa_logs` so the client can reconcile against their
 * M-Pesa statement.
 *
 * Secrets are redacted BEFORE anything is written — no passkey, consumer
 * secret or Authorization header ever reaches the database.
 */

const SECRET_KEYS = [
  'password',
  'passkey',
  'consumersecret',
  'consumerkey',
  'authorization',
  'access_token',
  'securitycredential',
];

/** Deep-redact anything that looks like a credential. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.includes(k.toLowerCase()) ? '[REDACTED]' : redact(v);
    }
    return out;
  }
  return value;
}

export type MpesaLogEntry = {
  direction: 'request' | 'response' | 'callback' | 'query';
  endpoint: string;
  orderNumber?: string;
  checkoutRequestId?: string;
  payload: unknown;
};

export async function logMpesa(entry: MpesaLogEntry): Promise<void> {
  try {
    await serviceClient()
      .from('mpesa_logs')
      .insert({
        direction: entry.direction,
        endpoint: entry.endpoint,
        payload: {
          ...(redact(entry.payload) as Record<string, unknown>),
          ...(entry.orderNumber ? { _order_number: entry.orderNumber } : {}),
          ...(entry.checkoutRequestId ? { _checkout_request_id: entry.checkoutRequestId } : {}),
        },
      });
  } catch {
    // Logging must never break a payment flow.
  }
}
