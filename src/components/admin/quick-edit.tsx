'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Lock,
  Tag,
  X,
} from 'lucide-react';
import type { ProductImage } from '@/lib/admin/data';
import { formatKes } from '@/lib/shop';
import { cn } from '@/lib/utils';
import { CommitBar } from '@/components/admin/commit-bar';

/**
 * Quick edit — change a price or a photograph on a phone, one handed.
 *
 * Three views behind one commit. The price and the photographs are edited
 * separately because they are different jobs done at different moments, but
 * they share a single write: whatever is pending when "Commit change" is
 * pressed goes up together, so a person who changed both does not have to
 * remember to save twice.
 *
 * Nothing here writes on its own. That is deliberate — this screen is used
 * while holding a product in the other hand, and an interface that saved on
 * every keystroke would turn a mistyped digit into a live price.
 */

type View = 'menu' | 'price' | 'photo';

export function QuickEdit({
  slug,
  name,
  brand,
  modelCode,
  costExVat,
  suggestedPrice,
  initialPrice,
  initialImages,
  shopHref,
}: {
  slug: string;
  name: string;
  brand: string;
  modelCode: string | null;
  costExVat: number | null;
  suggestedPrice: number | null;
  initialPrice: number | null;
  initialImages: ProductImage[];
  shopHref: string;
}) {
  const router = useRouter();
  const [view, setView] = React.useState<View>('menu');
  const [price, setPrice] = React.useState<number | null>(initialPrice);
  const [images, setImages] = React.useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  const fileInput = React.useRef<HTMLInputElement>(null);
  const cameraInput = React.useRef<HTMLInputElement>(null);

  const priceChanged = price !== initialPrice;
  const imagesChanged = JSON.stringify(images) !== JSON.stringify(initialImages);
  const changes: string[] = [];
  if (priceChanged) {
    changes.push(
      `${initialPrice != null ? formatKes(initialPrice) : 'no price'} → ${
        price != null ? formatKes(price) : 'no price'
      }`
    );
  }
  if (imagesChanged) {
    const delta = images.length - initialImages.length;
    changes.push(delta > 0 ? `${delta} photo added` : delta < 0 ? `${-delta} photo removed` : 'photos reordered');
  }

  /* ---------------------------------------------------------------- margin */

  // Retail is VAT-inclusive and cost is held ex-VAT, so the VAT portion comes
  // off the price before the two are compared. Same arithmetic the products
  // list uses, repeated here so the figure moves as the number is typed.
  const retailExVat = price != null ? price / 1.16 : null;
  const marginKes =
    retailExVat != null && costExVat != null ? Math.round(retailExVat - costExVat) : null;
  const marginPercent =
    marginKes != null && costExVat != null && costExVat > 0
      ? Math.round((marginKes / costExVat) * 1000) / 10
      : null;
  const belowCost = marginKes != null && marginKes < 0;

  /* ---------------------------------------------------------------- upload */

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = 3 - images.length;
    if (room <= 0) {
      setUploadError('Three photographs is the limit. Remove one first.');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files)
        .slice(0, room)
        .forEach((f) => form.append('files', f));
      const res = await fetch('/api/admin/products/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setUploadError(data.error ?? 'That upload did not work.');
        return;
      }
      setImages((current) => [...current, ...(data.images ?? data.uploaded ?? [])].slice(0, 3));
    } catch {
      setUploadError('Could not reach the server. Check your signal.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
      if (cameraInput.current) cameraInput.current.value = '';
    }
  };

  /* ---------------------------------------------------------------- commit */

  const commit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {};
      if (priceChanged) body.retailPrice = price;
      if (imagesChanged) body.images = images;
      const res = await fetch(`/api/admin/products/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveError(data.error ?? 'That change was not saved.');
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setSaveError('Could not reach the server. Check your signal.');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setPrice(initialPrice);
    setImages(initialImages);
    setConfirmDiscard(false);
    setView('menu');
  };

  /* ----------------------------------------------------------------- saved */

  if (saved) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-card border border-oriel-line bg-oriel-white p-6 text-center">
          <span
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-pill bg-oriel-green text-oriel-white"
            aria-hidden
          >
            <Check size={24} strokeWidth={3} />
          </span>
          <p className="font-headline text-[1.0625rem] font-semibold text-oriel-green-deep">Saved</p>
          {changes.length > 0 && (
            <p className="mt-2 font-mono text-small text-oriel-navy-ink">{changes.join(' · ')}</p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={shopHref}
              className="flex h-12 items-center justify-center rounded-input bg-oriel-orange px-5 text-small font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep"
            >
              View it on the shop
            </Link>
            <Link
              href="/admin/products"
              className="flex h-12 items-center justify-center rounded-input border border-oriel-line bg-oriel-white px-5 text-small font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
            >
              Back to products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ chrome */

  const back =
    view === 'menu' ? (
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate transition-colors hover:text-oriel-navy"
      >
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden /> All products
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => setView('menu')}
        className="inline-flex items-center gap-1 text-small font-medium text-oriel-slate transition-colors hover:text-oriel-navy"
      >
        <ChevronLeft size={18} strokeWidth={1.5} aria-hidden /> Back
      </button>
    );

  return (
    <div className="mx-auto w-full max-w-3xl pb-32">
      {back}

      <h1 className="mt-4 font-headline text-[1.75rem] font-semibold tracking-tight text-oriel-navy">
        {view === 'price' ? 'Change the price' : view === 'photo' ? 'Change the photograph' : 'Quick edit'}
      </h1>
      <p className="mt-1 truncate text-small text-oriel-slate">
        {view === 'photo' ? 'Up to three. JPEG, PNG or WebP, under 5MB each.' : name}
      </p>

      {/* -------------------------------------------------------------- menu */}
      {view === 'menu' && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 rounded-card border border-oriel-line bg-oriel-white p-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-input bg-oriel-mist">
              {images[0]?.url ? (
                <Image
                  src={images[0].url}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              ) : (
                <ImagePlus size={20} strokeWidth={1.5} className="text-oriel-slate" aria-hidden />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-eyebrow uppercase tracking-[0.12em] text-oriel-slate">
                {brand}
              </span>
              <span className="block font-headline text-[1.0625rem] font-semibold leading-tight text-oriel-navy">
                {name}
              </span>
              {modelCode && (
                <span className="mt-0.5 block font-mono text-[0.6875rem] text-oriel-slate">
                  {modelCode}
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setView('price')}
            className="flex w-full items-center gap-4 rounded-card border border-oriel-line bg-oriel-white p-5 text-left transition-all duration-200 ease-oriel-out hover:border-oriel-orange hover:shadow-oriel-lift"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-oriel-orange-soft text-oriel-orange-deep"
              aria-hidden
            >
              <Tag size={20} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-headline text-small font-semibold text-oriel-navy">
                Change the price
              </span>
              <span className="mt-0.5 block font-mono text-[1.25rem] font-medium text-oriel-navy-ink">
                {price != null ? formatKes(price) : 'no price'}
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => setView('photo')}
            className="flex w-full items-center gap-4 rounded-card border border-oriel-line bg-oriel-white p-5 text-left transition-all duration-200 ease-oriel-out hover:border-oriel-navy hover:shadow-oriel-lift"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-oriel-navy/10 text-oriel-navy"
              aria-hidden
            >
              <Camera size={20} strokeWidth={1.5} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-headline text-small font-semibold text-oriel-navy">
                Change the photograph
              </span>
              <span className="mt-0.5 block text-small text-oriel-slate">
                {images.length === 0
                  ? 'No photographs'
                  : `${images.length} ${images.length === 1 ? 'photograph' : 'photographs'}`}
              </span>
            </span>
            <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-oriel-slate" aria-hidden />
          </button>

          <p className="flex items-start gap-2.5 rounded-card bg-oriel-navy-deep p-4 text-caption text-oriel-white/85">
            <Lock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-oriel-gold" aria-hidden />
            Cost and margin are staff-only. They never appear on the public site.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------- price */}
      {view === 'price' && (
        <div className="mt-6 rounded-card border border-oriel-line bg-oriel-white p-5">
          <label
            htmlFor="quick-price"
            className="mb-2 block text-small font-medium text-oriel-navy-ink"
          >
            What the customer pays
          </label>
          <div className="mb-6 flex h-14 items-center overflow-hidden rounded-input border border-oriel-line bg-oriel-white transition-all focus-within:border-oriel-navy focus-within:ring-2 focus-within:ring-oriel-navy/20">
            <span className="pl-4 pr-1 font-mono text-[1.25rem] text-oriel-slate" aria-hidden>
              KES
            </span>
            <input
              id="quick-price"
              inputMode="numeric"
              value={price != null ? price.toLocaleString('en-KE') : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setPrice(digits ? Number.parseInt(digits, 10) : null);
              }}
              className="h-full w-full border-none bg-transparent p-0 font-mono text-[1.5rem] font-medium text-oriel-navy-ink focus:outline-none focus:ring-0"
            />
          </div>

          {suggestedPrice != null && (
            <div className="mb-6">
              <p className="mb-3 text-eyebrow font-semibold uppercase tracking-[0.12em] text-oriel-slate">
                Suggested from cost
              </p>
              <div className="flex gap-2">
                {[initialPrice, suggestedPrice, Math.ceil((suggestedPrice * 1.05) / 100) * 100]
                  .filter((v): v is number => v != null)
                  .map((v, i) => (
                    <button
                      key={`${v}-${i}`}
                      type="button"
                      onClick={() => setPrice(v)}
                      className="flex-1 rounded-pill border border-oriel-line bg-oriel-white py-2 font-mono text-micro font-medium text-oriel-navy-ink transition-colors hover:bg-oriel-mist"
                    >
                      {v.toLocaleString('en-KE')}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Live margin — the point of the screen. Someone setting a price can
              see what it earns before they commit it. */}
          <div
            className={cn(
              'flex items-center justify-between rounded-input border p-3',
              belowCost ? 'border-oriel-gold bg-oriel-gold-soft' : 'border-oriel-line bg-oriel-mist'
            )}
          >
            {[
              { label: 'Cost', value: costExVat != null ? Math.round(costExVat) : null, tone: 'ink' },
              { label: 'Margin', value: marginKes, tone: 'margin' },
              { label: 'Percent', value: marginPercent, tone: 'margin', suffix: '%' },
            ].map((col, i) => (
              <React.Fragment key={col.label}>
                {i > 0 && <span className="h-8 w-px bg-oriel-line" aria-hidden />}
                <span className="flex flex-col">
                  <span className="mb-1 text-eyebrow font-semibold uppercase tracking-[0.12em] text-oriel-slate">
                    {col.label}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-small font-medium',
                      col.tone === 'margin' && marginPercent != null && marginPercent >= 20
                        ? 'text-oriel-green-deep'
                        : 'text-oriel-navy-ink'
                    )}
                  >
                    {col.value != null ? `${col.value.toLocaleString('en-KE')}${col.suffix ?? ''}` : '—'}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>

          {belowCost && (
            <p className="mt-4 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
              That is below what you paid for it.
            </p>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- photo */}
      {view === 'photo' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.url} className="relative">
                <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-input border border-oriel-line bg-oriel-mist">
                  <Image
                    src={img.url}
                    alt={img.alt ?? ''}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                  />
                </span>
                <button
                  type="button"
                  onClick={() => setImages((c) => c.filter((_, j) => j !== i))}
                  aria-label="Remove this photograph"
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-pill bg-oriel-navy/85 text-oriel-white"
                >
                  <X size={13} strokeWidth={2.5} aria-hidden />
                </button>
                {i === 0 ? (
                  <span className="mt-1.5 block rounded-pill bg-oriel-navy py-0.5 text-center text-[0.625rem] uppercase tracking-[0.12em] text-oriel-white">
                    Main
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setImages((c) => [c[i], ...c.filter((_, j) => j !== i)])
                    }
                    className="mt-1.5 block w-full rounded-pill border border-oriel-line py-0.5 text-center text-[0.625rem] font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist"
                  >
                    Make main
                  </button>
                )}
              </div>
            ))}

            {images.length < 3 && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-input border border-dashed border-oriel-line text-oriel-slate transition-colors hover:border-oriel-navy hover:text-oriel-navy disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" aria-hidden />
                    <span className="text-micro">Uploading</span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={20} strokeWidth={1.5} aria-hidden />
                    <span className="text-micro">Add</span>
                  </>
                )}
              </button>
            )}
          </div>

          {uploadError && (
            <p className="rounded-input bg-oriel-gold-soft p-3 text-micro text-oriel-navy-ink">
              {uploadError}
            </p>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => void upload(e.target.files)}
          />
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => void upload(e.target.files)}
          />

          {/* The camera comes first and orange: the picture is usually being
              taken, not found. */}
          <button
            type="button"
            onClick={() => cameraInput.current?.click()}
            disabled={uploading || images.length >= 3}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-input bg-oriel-orange text-body-lg font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-60"
          >
            <Camera size={20} strokeWidth={1.5} aria-hidden /> Take a photograph
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading || images.length >= 3}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-input border border-oriel-navy bg-oriel-white text-body-lg font-semibold text-oriel-navy transition-colors hover:bg-oriel-mist disabled:opacity-60"
          >
            Choose from the phone
          </button>
        </div>
      )}

      {saveError && (
        <p className="mt-4 rounded-input bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink">
          {saveError}
        </p>
      )}

      {confirmDiscard && (
        <div className="mt-4 rounded-input bg-oriel-gold-soft p-4">
          <p className="text-small text-oriel-navy-ink">Throw away the changes you have made?</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={discard}
              className="rounded-input bg-oriel-orange px-4 py-2 text-micro font-semibold text-oriel-white"
            >
              Yes, discard
            </button>
            <button
              type="button"
              onClick={() => setConfirmDiscard(false)}
              className="rounded-input border border-oriel-line bg-oriel-white px-4 py-2 text-micro font-semibold text-oriel-navy"
            >
              Keep editing
            </button>
          </div>
        </div>
      )}

      <CommitBar
        changeCount={changes.length}
        summary={changes.join(' · ')}
        onCommit={commit}
        onDiscard={() => setConfirmDiscard(true)}
        saving={saving}
      />
    </div>
  );
}
