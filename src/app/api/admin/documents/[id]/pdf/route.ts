import { NextResponse } from 'next/server';
import { isStaffAuthenticated } from '@/lib/admin/session';
import { documentFilename, renderDocumentPdf, type RenderMode } from '@/lib/documents/pdf';
import { getDocument } from '@/lib/documents/store';

/**
 * Download a document as a PDF. Staff only.
 *
 * `copy=both` is the one the counter prints: original above the fold,
 * duplicate below, tear line between — the pad, on a single A4 sheet.
 * `copy=original` is what gets attached to a WhatsApp message.
 */
export const dynamic = 'force-dynamic';

const MODES: RenderMode[] = ['original', 'duplicate', 'both'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isStaffAuthenticated()) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const document = await getDocument(params.id);
  if (!document) {
    return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('copy') as RenderMode | null;
  const mode: RenderMode = requested && MODES.includes(requested) ? requested : 'both';
  // Inline by default so the browser's own viewer opens it and the clerk can
  // check the figures before committing to a print or a send.
  const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline';

  const bytes = await renderDocumentPdf(document, mode);

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${documentFilename(document, mode)}"`,
      // A draft's figures change as it is edited, and a cached PDF of an
      // earlier version is worse than a slow one.
      'Cache-Control': 'private, no-store',
    },
  });
}
