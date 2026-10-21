import 'server-only';
import { Resend } from 'resend';
import { serviceClient } from '@/lib/supabase';

/**
 * Outbound email, through Resend.
 *
 * Three properties this module is built around, in order of importance:
 *
 *  1. **Sending never fails the caller.** Every function returns a result
 *     object; none of them throw. An order is taken, a payment lands, a status
 *     moves on — those must all succeed whether or not the mail provider is
 *     having a good afternoon. A customer who does not get their receipt can
 *     be sent it again from the admin; an order lost because Resend timed out
 *     cannot be recovered at all.
 *
 *  2. **Every attempt is recorded**, including the ones that failed and the
 *     ones that were skipped for want of an API key. When someone rings to say
 *     they never received their receipt, the answer has to be checkable.
 *
 *  3. **No key means no send, loudly.** With RESEND_API_KEY unset the message
 *     is written to the log with status 'skipped' and printed to the server
 *     console in full, so the copy can be reviewed in development exactly as
 *     customers will receive it — the behaviour the old file-backed notifier
 *     had, kept.
 */

export type EmailAttachment = {
  filename: string;
  content: Uint8Array;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Identifies the message in the audit trail, e.g. 'receipt' or 'status:processing'. */
  template: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  orderId?: string | null;
  documentId?: string | null;
};

export type SendEmailResult =
  | { status: 'sent'; id: string | null }
  | { status: 'skipped'; reason: string }
  | { status: 'failed'; error: string };

let client: Resend | null = null;

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/**
 * The From address.
 *
 * Resend will only deliver from a domain verified in the account. Until
 * orielpower.com is verified there, every send fails with a 403 and the reason
 * is recorded in email_log — which is the correct failure: silently rewriting
 * the sender to a resend.dev address would put a stranger's domain on the
 * company's receipts. Set EMAIL_FROM once the domain is verified; the default
 * is what it should end up as.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || 'Oriel Power Ltd <orders@orielpower.com>';
}

/** Where a customer's reply should land. Their inbox, not a no-reply void. */
function replyToAddress(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || 'info@orielpower.com';
}

/** The address that gets the shop's own copy of everything. */
export function staffAddress(): string {
  return process.env.ORDER_NOTIFICATION_EMAIL?.trim() || 'orielpowerdm@gmail.com';
}

async function log(entry: {
  to: string;
  subject: string;
  template: string;
  orderId?: string | null;
  documentId?: string | null;
  providerMessageId?: string | null;
  status: string;
  error?: string | null;
}): Promise<void> {
  try {
    await serviceClient().from('email_log').insert({
      to_address: entry.to,
      subject: entry.subject,
      template: entry.template,
      order_id: entry.orderId ?? null,
      document_id: entry.documentId ?? null,
      provider_message_id: entry.providerMessageId ?? null,
      status: entry.status,
      error: entry.error ?? null,
    });
  } catch (error) {
    // The audit trail must never be the thing that breaks a send.
    console.error('[email] could not write to email_log:', (error as Error).message);
  }
}

function looksLikeAnAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to?.trim();

  if (!to || !looksLikeAnAddress(to)) {
    const reason = 'No usable email address';
    await log({ ...input, to: to || '(none)', status: 'skipped', error: reason });
    return { status: 'skipped', reason };
  }

  const mailer = resend();
  if (!mailer) {
    const reason = 'RESEND_API_KEY is not set';
    console.info(
      `\n[email:skipped] ${reason}\n  To: ${to}\n  Subject: ${input.subject}\n${input.text}\n`
    );
    await log({ ...input, to, status: 'skipped', error: reason });
    return { status: 'skipped', reason };
  }

  try {
    const { data, error } = await mailer.emails.send({
      from: fromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo ?? replyToAddress(),
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        // Resend takes base64 or a Buffer. Buffer is exact for binary and
        // avoids a needless third copy of a PDF that can run to 300KB.
        content: Buffer.from(attachment.content),
      })),
    });

    if (error) {
      const message = error.message ?? 'Unknown Resend error';
      console.error(`[email:failed] ${to} — ${message}`);
      await log({ ...input, to, status: 'failed', error: message });
      return { status: 'failed', error: message };
    }

    await log({ ...input, to, status: 'sent', providerMessageId: data?.id ?? null });
    return { status: 'sent', id: data?.id ?? null };
  } catch (error) {
    const message = (error as Error).message ?? 'Unknown error';
    console.error(`[email:failed] ${to} — ${message}`);
    await log({ ...input, to, status: 'failed', error: message });
    return { status: 'failed', error: message };
  }
}

/** The last twenty send attempts, newest first. Powers the admin's email panel. */
export async function recentEmails(limit = 20): Promise<
  {
    to: string;
    subject: string;
    template: string;
    status: string;
    error: string | null;
    at: string;
  }[]
> {
  const { data } = await serviceClient()
    .from('email_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return ((data as Record<string, unknown>[]) ?? []).map((row) => ({
    to: String(row.to_address),
    subject: String(row.subject),
    template: String(row.template),
    status: String(row.status),
    error: (row.error as string) ?? null,
    at: String(row.created_at),
  }));
}
