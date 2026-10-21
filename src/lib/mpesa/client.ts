import 'server-only';
import { logMpesa } from '@/lib/mpesa/log';

/**
 * Safaricom Daraja — Lipa na M-Pesa Online (STK Push).
 *
 * Every call in this module runs server-side only. No key, secret, passkey or
 * shortcode may ever reach the client bundle (MASTERPLAN 10.1).
 *
 * When Daraja credentials are absent the module runs in SIMULATOR mode so the
 * complete flow — push, callback, status query, failures — can be exercised
 * and demonstrated without credentials. Simulator mode is refused outright
 * when MPESA_ENVIRONMENT=production, so it can never run against real money.
 */

const BASE_URL: Record<string, string> = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
};

export type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
};

export function readConfig(): MpesaConfig | null {
  const {
    MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET,
    MPESA_SHORTCODE,
    MPESA_PASSKEY,
    MPESA_CALLBACK_URL,
  } = process.env;
  const environment = process.env.MPESA_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  if (
    !MPESA_CONSUMER_KEY ||
    !MPESA_CONSUMER_SECRET ||
    !MPESA_SHORTCODE ||
    !MPESA_PASSKEY ||
    !MPESA_CALLBACK_URL
  ) {
    return null;
  }
  return {
    consumerKey: MPESA_CONSUMER_KEY,
    consumerSecret: MPESA_CONSUMER_SECRET,
    shortcode: MPESA_SHORTCODE,
    passkey: MPESA_PASSKEY,
    environment,
    callbackUrl: MPESA_CALLBACK_URL,
  };
}

/** True when no credentials are configured — simulator mode. */
export function isSimulated(): boolean {
  if (readConfig() !== null) return false;
  if (process.env.MPESA_ENVIRONMENT === 'production') {
    throw new Error(
      'MPESA_ENVIRONMENT=production but Daraja credentials are missing. Refusing to simulate payments in production.'
    );
  }
  return true;
}

/** Daraja timestamp: YYYYMMDDHHmmss in East Africa Time. */
export function darajaTimestamp(now = new Date()): string {
  const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000); // UTC+3, no DST in Kenya
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${eat.getUTCFullYear()}${p(eat.getUTCMonth() + 1)}${p(eat.getUTCDate())}` +
    `${p(eat.getUTCHours())}${p(eat.getUTCMinutes())}${p(eat.getUTCSeconds())}`
  );
}

function stkPassword(config: MpesaConfig, timestamp: string): string {
  return Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64');
}

// Access tokens are valid for ~1 hour; cache until shortly before expiry.
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(config: MpesaConfig): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;

  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString(
    'base64'
  );
  const res = await fetch(
    `${BASE_URL[config.environment]}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` }, cache: 'no-store' }
  );
  if (!res.ok) {
    throw new Error(`Daraja auth failed with status ${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: string };
  if (!data.access_token) throw new Error('Daraja auth returned no access token');

  const ttlSeconds = Number.parseInt(data.expires_in ?? '3599', 10);
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, ttlSeconds - 60) * 1000,
  };
  return data.access_token;
}

export type StkPushResult =
  | { ok: true; checkoutRequestId: string; merchantRequestId: string; customerMessage: string }
  | { ok: false; error: string };

/**
 * Initiate an STK push. The amount MUST be an integer — Daraja rejects
 * decimals (MASTERPLAN 10.3 step 3).
 */
export async function initiateSTKPush(params: {
  msisdn: string; // 2547XXXXXXXX / 2541XXXXXXXX
  amount: number;
  orderNumber: string;
}): Promise<StkPushResult> {
  const amount = Math.ceil(params.amount);
  if (!Number.isInteger(amount) || amount < 1) {
    return { ok: false, error: 'Invalid amount' };
  }

  const config = readConfig();

  if (config === null) {
    isSimulated(); // throws if MPESA_ENVIRONMENT=production
    const { simulateStkPush } = await import('@/lib/mpesa/simulator');
    return simulateStkPush({ ...params, amount });
  }

  const timestamp = darajaTimestamp();
  const body = {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config, timestamp),
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: params.msisdn,
    PartyB: config.shortcode,
    PhoneNumber: params.msisdn,
    CallBackURL: config.callbackUrl,
    AccountReference: params.orderNumber,
    TransactionDesc: 'Oriel Power order',
  };

  await logMpesa({
    direction: 'request',
    endpoint: 'stkpush',
    orderNumber: params.orderNumber,
    payload: body,
  });

  try {
    const token = await getAccessToken(config);
    const res = await fetch(`${BASE_URL[config.environment]}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = (await res.json()) as Record<string, unknown>;

    await logMpesa({
      direction: 'response',
      endpoint: 'stkpush',
      orderNumber: params.orderNumber,
      payload: data,
    });

    if (!res.ok || data.ResponseCode !== '0') {
      return {
        ok: false,
        error:
          typeof data.errorMessage === 'string'
            ? data.errorMessage
            : "M-Pesa couldn't start the payment. Try again.",
      };
    }
    return {
      ok: true,
      checkoutRequestId: String(data.CheckoutRequestID),
      merchantRequestId: String(data.MerchantRequestID),
      customerMessage: String(data.CustomerMessage ?? 'Check your phone'),
    };
  } catch (error) {
    await logMpesa({
      direction: 'response',
      endpoint: 'stkpush',
      orderNumber: params.orderNumber,
      payload: { error: error instanceof Error ? error.message : 'unknown' },
    });
    return { ok: false, error: "We couldn't reach M-Pesa. Check your connection and try again." };
  }
}

export type StatusQueryResult =
  | { ok: true; resultCode: number; resultDesc: string }
  | { ok: false; pending: boolean; error: string };

/**
 * Query a transaction's final state. This is the fallback that resolves a
 * missing callback — Kenyan networks drop them, and this is NOT optional
 * (MASTERPLAN 10.3 step 7).
 */
export async function queryTransactionStatus(
  checkoutRequestId: string
): Promise<StatusQueryResult> {
  const config = readConfig();

  if (config === null) {
    isSimulated();
    const { simulateStatusQuery } = await import('@/lib/mpesa/simulator');
    return simulateStatusQuery(checkoutRequestId);
  }

  const timestamp = darajaTimestamp();
  const body = {
    BusinessShortCode: config.shortcode,
    Password: stkPassword(config, timestamp),
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  try {
    const token = await getAccessToken(config);
    const res = await fetch(`${BASE_URL[config.environment]}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = (await res.json()) as Record<string, unknown>;

    await logMpesa({
      direction: 'query',
      endpoint: 'stkpushquery',
      checkoutRequestId,
      payload: data,
    });

    // Daraja returns errorCode 500.001.1001 while the request is still being
    // processed — that is "not finished yet", not a failure.
    if (typeof data.errorCode === 'string' && data.errorCode.includes('500.001.1001')) {
      return { ok: false, pending: true, error: 'Still processing' };
    }
    if (data.ResultCode === undefined) {
      return { ok: false, pending: true, error: 'No result yet' };
    }
    return {
      ok: true,
      resultCode: Number(data.ResultCode),
      resultDesc: String(data.ResultDesc ?? ''),
    };
  } catch (error) {
    return {
      ok: false,
      pending: true,
      error: error instanceof Error ? error.message : 'Query failed',
    };
  }
}

/**
 * Parse a Daraja STK callback body into a normalised shape.
 * Never trusts field presence — a malformed callback must not throw.
 */
export type ParsedCallback = {
  merchantRequestId: string;
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceipt?: string;
  transactionDate?: string;
  phoneNumber?: string;
  amount?: number;
};

export function parseCallback(body: unknown): ParsedCallback | null {
  const stk = (body as { Body?: { stkCallback?: Record<string, unknown> } })?.Body?.stkCallback;
  if (!stk || typeof stk.CheckoutRequestID !== 'string') return null;

  const parsed: ParsedCallback = {
    merchantRequestId: String(stk.MerchantRequestID ?? ''),
    checkoutRequestId: stk.CheckoutRequestID,
    resultCode: Number(stk.ResultCode ?? -1),
    resultDesc: String(stk.ResultDesc ?? ''),
  };

  const items = (stk.CallbackMetadata as { Item?: { Name?: string; Value?: unknown }[] })?.Item;
  if (Array.isArray(items)) {
    for (const item of items) {
      switch (item?.Name) {
        case 'MpesaReceiptNumber':
          parsed.mpesaReceipt = String(item.Value);
          break;
        case 'TransactionDate':
          parsed.transactionDate = String(item.Value);
          break;
        case 'PhoneNumber':
          parsed.phoneNumber = String(item.Value);
          break;
        case 'Amount':
          parsed.amount = Number(item.Value);
          break;
      }
    }
  }
  return parsed;
}
