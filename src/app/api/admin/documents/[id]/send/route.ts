import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { sendSchema } from '@/lib/documents/schema';
import { documentFilename, renderDocumentPdf } from '@/lib/documents/pdf';
import { getDocument, issueDocument, recordDocumentSent } from '@/lib/documents/store';
import { sendEmail } from '@/lib/email/client';
import { documentEmail } from '@/lib/email/templates';

/**
 * Email a document to the customer, with the PDF attached.
 *
 * A draft is issued first. Sending a customer a document with no number on it
 * would give them something they cannot quote back at us, and would leave the
 * shop with no record tying the email to a numbered sale.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the address' },
      { status: 400 }
    );
  }

  const existing = await getDocument(params.id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
  }
  if (existing.status === 'void') {
    return NextResponse.json(
      { ok: false, error: 'This document has been voided and cannot be sent' },
      { status: 409 }
    );
  }

  try {
    const document = existing.docNumber ? existing : await issueDocument(existing.id);
    const message = documentEmail(document, parsed.data.note);

    const result = await sendEmail({
      to: parsed.data.to,
      ...message,
      template: `document:${document.docType}`,
      attachments: [
        {
          filename: documentFilename(document, 'original'),
          content: await renderDocumentPdf(document, 'original'),
        },
      ],
      orderId: document.orderId,
      documentId: document.id,
    });

    if (result.status === 'sent') {
      await recordDocumentSent(document.id, parsed.data.to);
      return NextResponse.json({ ok: true, docNumber: document.docNumber });
    }

    // Told plainly rather than swallowed: the clerk is standing in front of the
    // customer and needs to know now whether to reach for WhatsApp instead.
    return NextResponse.json(
      {
        ok: false,
        error:
          result.status === 'skipped'
            ? `Not sent — ${result.reason}. Download the PDF and send it over WhatsApp instead.`
            : `The email could not be sent: ${result.error}`,
        docNumber: document.docNumber,
      },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || 'Could not send the document' },
      { status: 500 }
    );
  }
}
