'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ImagePlus, Loader2, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/**
 * Add a product. Written for someone standing in a store room with a phone and
 * a new delivery, not for a developer.
 *
 * The ordering is deliberate: photograph it, name it, say where it goes, price
 * it. Everything else is optional and sits below a fold. Nothing here asks for
 * a slug, a SEO title or a spec table — those either derive from the name or
 * are genuinely optional, and a required field nobody understands is how a
 * form stops being used.
 *
 * Images upload as soon as they are chosen so the slow part overlaps with the
 * typing, and the product is only created once they have URLs.
 */

type Uploaded = { url: string; alt: string; type: string };

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = Object.fromEntries(
  CATEGORIES.map((c) => [
    c.slug,
    c.subcategories.map((s) => ({
      value: new URL(s.href, 'https://x').searchParams.get('type') ?? '',
      label: s.label,
    })),
  ])
);

const field =
  'h-11 w-full rounded-input border border-oriel-line px-3 text-small text-oriel-navy-ink placeholder:text-oriel-slate focus:border-oriel-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange';

function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-small font-medium text-oriel-navy-ink">
        {label}
        {!required && <span className="ml-1 font-normal text-oriel-slate">(optional)</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-micro text-oriel-slate">{hint}</span>}
    </label>
  );
}

export function ProductForm({ brands }: { brands: { id: string; name: string }[] }) {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [subcategory, setSubcategory] = React.useState('');
  const [brand, setBrand] = React.useState('');
  const [modelCode, setModelCode] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [cost, setCost] = React.useState('');
  const [stockQty, setStockQty] = React.useState('');
  const [warranty, setWarranty] = React.useState('');
  const [specsText, setSpecsText] = React.useState('');
  const [requiresInstallation, setRequiresInstallation] = React.useState(false);
  const [images, setImages] = React.useState<Uploaded[]>([]);

  const [uploading, setUploading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ href: string; note: string | null } | null>(null);

  const subOptions = SUBCATEGORY_OPTIONS[category] ?? [];

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = 3 - images.length;
    if (room <= 0) {
      setError('Three images is the limit. Remove one first.');
      return;
    }
    setUploading(true);
    setError(null);
    const body = new FormData();
    Array.from(list)
      .slice(0, room)
      .forEach((f) => body.append('files', f));
    try {
      const res = await fetch('/api/admin/products/upload', { method: 'POST', body });
      const json = (await res.json()) as { ok: boolean; images?: Uploaded[]; error?: string };
      if (!json.ok) setError(json.error ?? 'Upload failed.');
      else setImages((prev) => [...prev, ...(json.images ?? [])].slice(0, 3));
    } catch {
      setError('Could not reach the server.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          subcategory,
          brand,
          modelCode,
          shortDescription,
          retailPrice: price.trim() ? Number(price) : null,
          costPrice: cost.trim() ? Number(cost) : null,
          stockQty: stockQty.trim() ? Number(stockQty) : null,
          warrantyYears: warranty.trim() ? Number(warranty) : null,
          keySpecs: specsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 8),
          requiresInstallation,
          images,
          isPublished: true,
          stockStatus: 'in_stock',
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        href?: string;
        note?: string | null;
        error?: string;
      };
      if (!json.ok) {
        setError(json.error ?? 'Could not save.');
        return;
      }
      setDone({ href: json.href ?? '/admin/products', note: json.note ?? null });
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-card border border-oriel-line bg-oriel-white p-6">
        <p className="flex items-center gap-2 font-headline text-[1.0625rem] font-semibold text-oriel-navy">
          <Check size={20} strokeWidth={2} className="text-oriel-green-deep" aria-hidden />
          {name} is saved
        </p>
        {done.note && <p className="mt-2 text-small text-oriel-navy-ink">{done.note}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={done.href}
            target="_blank"
            className="rounded-input bg-oriel-orange px-4 py-2.5 text-small font-semibold text-oriel-white hover:bg-oriel-orange-deep"
          >
            View it on the shop
          </Link>
          <button
            type="button"
            onClick={() => {
              setDone(null);
              setName('');
              setModelCode('');
              setShortDescription('');
              setPrice('');
              setCost('');
              setStockQty('');
              setSpecsText('');
              setImages([]);
            }}
            className="rounded-input border border-oriel-navy px-4 py-2.5 text-small font-semibold text-oriel-navy hover:bg-oriel-mist"
          >
            Add another
          </button>
          <Link
            href="/admin/products"
            className="rounded-input border border-oriel-line px-4 py-2.5 text-small font-semibold text-oriel-navy-ink hover:bg-oriel-mist"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Photographs first — it is what someone has in their hand. */}
      <section className="rounded-card border border-oriel-line bg-oriel-white p-5">
        <h2 className="t-h3">Photographs</h2>
        <p className="mt-1 text-small text-oriel-slate">
          Up to three, chosen together. JPEG, PNG or WebP, under 5MB each.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div
              key={img.url}
              className="relative h-24 w-24 overflow-hidden rounded-input border border-oriel-line bg-oriel-mist"
            >
              <Image src={img.url} alt="" fill sizes="96px" className="object-contain p-1" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, n) => n !== i))}
                aria-label={`Remove image ${i + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-pill bg-oriel-navy/85 text-oriel-white"
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}

          {images.length < 3 && (
            <label
              className={cn(
                'flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-input border border-dashed border-oriel-line text-micro text-oriel-slate hover:border-oriel-navy hover:text-oriel-navy',
                uploading && 'pointer-events-none opacity-60'
              )}
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <ImagePlus size={18} strokeWidth={1.5} aria-hidden />
              )}
              {uploading ? 'Uploading' : 'Add'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void onFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-card border border-oriel-line bg-oriel-white p-5">
        <h2 className="t-h3">What it is</h2>

        <Field label="Product name" required>
          <input
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Livoltek 5kW Hybrid Inverter"
            required
            minLength={3}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Where it goes" required>
            <select
              className={field}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              required
            >
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type within it">
            <select
              className={field}
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              disabled={subOptions.length === 0}
            >
              <option value="">
                {subOptions.length === 0 ? 'Choose a category first' : 'No particular type'}
              </option>
              {subOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Brand">
            <select className={field} value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Model code">
            <input
              className={field}
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              placeholder="LV-5K-H"
            />
          </Field>
        </div>

        <Field
          label="One-line description"
          required
          hint="This is the sentence a customer reads on the listing."
        >
          <input
            className={field}
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="5kW single-phase hybrid inverter with 48V battery support."
            required
            minLength={10}
          />
        </Field>

        <Field label="Key specs" hint="Separated by commas. Up to eight, three show on the card.">
          <input
            className={field}
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            placeholder="5 kW, 48 V, Single phase"
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-card border border-oriel-line bg-oriel-white p-5">
        <h2 className="t-h3">Price and stock</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Selling price (KES)" required hint="What the customer pays.">
            <input
              className={field}
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="126000"
              required
            />
          </Field>

          <Field label="What it cost you (KES)" hint="Staff only. Drives the margin column.">
            <input
              className={field}
              type="number"
              min="1"
              step="1"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="98000"
            />
          </Field>

          <Field label="How many you have">
            <input
              className={field}
              type="number"
              min="0"
              step="1"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              placeholder="12"
            />
          </Field>

          <Field label="Warranty (years)">
            <input
              className={field}
              type="number"
              min="0"
              step="0.5"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              placeholder="5"
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-card bg-oriel-mist p-3 text-small text-oriel-navy-ink">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-oriel-orange"
            checked={requiresInstallation}
            onChange={(e) => setRequiresInstallation(e.target.checked)}
          />
          This needs professional installation
        </label>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-card border border-oriel-line bg-oriel-gold-soft p-3 text-small text-oriel-navy-ink"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex h-12 items-center gap-2 rounded-input bg-oriel-orange px-6 font-sans text-body font-semibold text-oriel-white transition-colors hover:bg-oriel-orange-deep disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {saving ? 'Saving' : 'Add to the shop'}
        </button>
        <Link href="/admin/products" className="text-small font-semibold text-oriel-navy underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
