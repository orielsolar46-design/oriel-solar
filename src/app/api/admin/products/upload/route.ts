import { NextResponse } from 'next/server';
import { guardAdminWrite } from '@/lib/admin/guard';
import { serviceClient } from '@/lib/supabase';

/**
 * Product image upload. Accepts up to three files in one request, because a
 * shop owner photographing a new arrival takes three shots and expects to send
 * them together.
 *
 * The bucket already refuses anything that is not an image and anything over
 * 5MB, but the bucket is the last line, not the first. Validation happens here
 * as well, on the declared type AND on the file's own magic bytes — a `.jpg`
 * extension and an `image/jpeg` header are both trivially forged, the leading
 * bytes are not. Anything that fails is rejected before it reaches storage.
 *
 * Filenames from the client are never used. Each object gets a generated name,
 * so a file called `../../etc/passwd` or a 300-character unicode string is
 * simply not expressible.
 */
export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

const SIGNATURES: { mime: string; ext: string; test: (b: Uint8Array) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
];

/** Identify by content, not by what the upload claims to be. */
function sniff(bytes: Uint8Array): { mime: string; ext: string } | null {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

export async function POST(request: Request) {
  const denied = guardAdminWrite(request);
  if (denied) {
    return NextResponse.json({ ok: false, error: denied.error }, { status: denied.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid upload' }, { status: 400 });
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: 'Choose at least one image' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { ok: false, error: `Three images at a time, please — you sent ${files.length}.` },
      { status: 400 }
    );
  }

  const db = serviceClient();
  const uploaded: { url: string; alt: string; type: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: `"${file.name}" is over 5MB. Photograph at a smaller size.` },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) {
      return NextResponse.json(
        { ok: false, error: `"${file.name}" is not a JPEG, PNG or WebP image.` },
        { status: 415 }
      );
    }

    const objectName = `${crypto.randomUUID()}.${kind.ext}`;
    const { error } = await db.storage.from(BUCKET).upload(objectName, bytes, {
      contentType: kind.mime,
      cacheControl: '31536000',
      upsert: false,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data } = db.storage.from(BUCKET).getPublicUrl(objectName);
    uploaded.push({ url: data.publicUrl, alt: '', type: 'product' });
  }

  return NextResponse.json({ ok: true, images: uploaded });
}
