import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { createDocument } from '@/lib/documents/store';
import { documentSchema } from '@/lib/documents/schema';

/** Write a new invoice or receipt. Session-gated. */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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

  // `issue` is a query flag rather than part of the body because it is a
  // decision about what to DO with the document, not a property of it: the
  // same payload saved as a draft and issued outright must produce the same
  // record either way.
  const issue = new URL(request.url).searchParams.get('issue') === '1';

  try {
    const document = await createDocument(parsed.data, { issue });
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message || 'Could not save the document' },
      { status: 500 }
    );
  }
}
