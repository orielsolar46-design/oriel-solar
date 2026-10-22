import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { revalidateCatalogue } from '@/lib/admin/revalidate';

/** Drop the cached catalogue and prerendered shop pages after a bulk sync. */
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const denied = guardAdminWrite(request);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status });
  }

  revalidateCatalogue();
  return NextResponse.json({ ok: true });
}
