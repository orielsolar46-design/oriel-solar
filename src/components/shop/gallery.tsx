'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

type GalleryImage = { url: string; alt: string; type: string };

/**
 * PDP gallery (MASTERPLAN 7.3): large frame, thumbnail rail, click to zoom,
 * swipeable on mobile via scroll-snap on the thumbnail rail.
 *
 * When the product is out of stock the main frame is veiled and blurred, the
 * same treatment the product card uses in the listing. Without it a shopper who
 * arrived straight on this page — from a search result, which is most of them —
 * saw an ordinary product and only learned it was unavailable at the basket.
 * The zoomed view is left clear: someone who has deliberately opened the image
 * wants to see the equipment, and the buy box has already told them the news.
 */
export function Gallery({
  images,
  name,
  outOfStock = false,
}: {
  images: GalleryImage[];
  name: string;
  outOfStock?: boolean;
}) {
  const frames: GalleryImage[] =
    images.length > 0
      ? images
      : [{ url: '/products/placeholder.svg', alt: `${name} — photograph coming soon`, type: 'primary' }];
  const [active, setActive] = React.useState(0);
  const [zoomed, setZoomed] = React.useState(false);
  const current = frames[Math.min(active, frames.length - 1)];

  React.useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="group relative block aspect-square w-full overflow-hidden rounded-card border border-oriel-line bg-oriel-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oriel-orange focus-visible:ring-offset-2"
        aria-label={`Zoom image: ${current.alt}`}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          className={cn('object-contain p-6', outOfStock && 'opacity-60')}
        />
        {outOfStock && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-oriel-white/60 backdrop-blur-[3px]">
            <span className="rounded-pill bg-oriel-navy/90 px-4 py-1.5 font-mono text-micro font-semibold uppercase tracking-wide text-oriel-white">
              Out of stock
            </span>
          </span>
        )}
        <span className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-pill bg-oriel-white text-oriel-navy shadow-oriel-rest transition-opacity opacity-70 group-hover:opacity-100">
          <ZoomIn size={16} strokeWidth={1.5} aria-hidden />
        </span>
      </button>

      {/* Thumbnails wrap rather than scrolling sideways: at 64px a full set of
          frames fits two rows on the narrowest phone, nothing hides off-screen. */}
      {frames.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {frames.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}: ${img.alt}`}
                aria-current={i === active}
                className={cn(
                  'relative block h-16 w-16 overflow-hidden rounded-input border bg-oriel-white transition-colors',
                  i === active ? 'border-oriel-orange' : 'border-oriel-line hover:border-oriel-navy'
                )}
              >
                <Image src={img.url} alt="" fill sizes="64px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-oriel-navy-ink/80 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            aria-label="Close zoom"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill bg-oriel-white text-oriel-navy"
            onClick={() => setZoomed(false)}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
          <div className="relative h-[85vh] w-full max-w-4xl">
            <Image src={current.url} alt={current.alt} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
