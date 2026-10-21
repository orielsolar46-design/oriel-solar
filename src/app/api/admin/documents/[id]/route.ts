import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { issueDocument, updateDocument } from '@/lib/documents/store';
import { documentSchema } from '@/lib/documents/schema';

/** Edit a document, and optionally issue it in the same call. */
export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the highlighted fields' },
      { status: 400 }
    );
  }

  try {
    let document = await updateDocument(params.id, parsed.data);
    if (new URL(request.url).searchParams.get('issue') === '1') {
      document = await issueDocument(document.id);
    }
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || 'Could not update the document' },
      { status: 400 }
    );
  }
}
