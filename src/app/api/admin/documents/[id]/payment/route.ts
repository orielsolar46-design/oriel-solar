import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { paymentSchema, voidSchema } from '@/lib/documents/schema';
import { recordDocumentPayment, voidDocument } from '@/lib/documents/store';

/**
 * Take money against an issued invoice, or void it.
 *
 * The two live together because they are the only two things that can happen
 * to a document once it has left the building, and both are settlement
 * decisions rather than edits.
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

  const action = (body as { action?: string })?.action;

  try {
    if (action === 'void') {
      const parsed = voidSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: parsed.error.issues[0]?.message ?? 'A reason is required' },
          { status: 400 }
        );
      }
      const document = await voidDocument(params.id, parsed.data.reason);
      return NextResponse.json({ ok: true, document });
    }

    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the amount' },
        { status: 400 }
      );
    }
    const document = await recordDocumentPayment(params.id, parsed.data);
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || 'Could not record that' },
      { status: 400 }
    );
  }
}
