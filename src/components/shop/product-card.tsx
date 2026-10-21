import Image from 'next/image';
import Link from 'next/link';
import type { PublicProduct } from '@/lib/catalogue';
import { AddToBasketButton } from '@/components/shop/add-to-basket';
import { PriceBlock } from '@/components/shop/price-block';
import { cn } from '@/lib/utils';

/**
 * Product card (MASTERPLAN 7.2): image with hover swap to the second frame,
 * stock pill top-left, brand eyebrow, display-face name, key specs as mono
 * chips, VAT-inclusive price, orange Add to basket.
 */
export function ProductCard({
  product,
  view = 'grid',
}: {
  product: PublicProduct;
  view?: 'grid' | 'list';
}) {
  const href = `/shop/${product.category}/${product.slug}`;
  const primary = product.images[0]?.url ?? '/products/placeholder.svg';
  const secondary = product.images[1]?.url;
  const alt = product.images[0]?.alt ?? `${product.name} — photograph coming soon`;

  return (
    <article
      className={cn(
        'group relative flex rounded-card border border-oriel-line bg-oriel-white shadow-oriel-rest transition-all duration-200 ease-out hover:-translate-y-1 hover:border-oriel-orange hover:shadow-oriel-lift',
        // h-full so every card in a grid row is the same height and the price
        // and button line up along the bottom, whatever the name length.
        view === 'grid' ? 'h-full flex-col' : 'flex-row items-stretch gap-4'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-oriel-white',
          view === 'grid'
            ? 'aspect-square w-full rounded-t-card'
            : 'w-36 shrink-0 self-center sm:w-44'
        )}
      >
        {/* Out of stock is the only stock state a customer sees. Everything
            else — in stock, low, on order — is bookkeeping and is no longer
            printed on the card. */}
        {product.outOfStock && (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-oriel-white/70 backdrop-blur-[3px]">
            <span className="rounded-pill bg-oriel-navy/90 px-3 py-1 text-micro font-semibold uppercase tracking-wide text-oriel-white">
              Out of stock
            </span>
          </span>
        )}
        <Image
          src={primary}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 300px"
          className={cn(
            'object-contain p-3 transition-opacity duration-200 sm:p-4',
            secondary && 'group-hover:opacity-0'
          )}
        />
        {secondary && (
          <Image
            src={secondary}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 300px"
            className="object-contain p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:p-4"
          />
        )}
      </div>

      {/* Padding tightens on a phone: at two cards across a 360px screen the
          card is ~155px wide, and 16px gutters would push the price onto two
          lines. */}
      <div className={cn('flex flex-1 flex-col p-3 sm:p-4', view === 'list' && 'py-4 pl-0 pr-4')}>
        <p className="t-eyebrow text-oriel-slate">{product.brand}</p>
        {/* Clamped on a phone: at two cards across, an unclamped name can run
            to six lines and shove the price out of sight. Full name on the
            product page, and from `sm` up there is room for all of it. */}
        <h3 className="mt-1 line-clamp-3 font-display text-[0.9375rem] font-semibold leading-snug text-oriel-navy sm:line-clamp-none sm:text-[1rem]">
          <Link href={href} className="focus-visible:outline-none">
            {/* Stretched link makes the whole card clickable without nesting interactive elements */}
            <span className="absolute inset-0 z-0" aria-hidden />
            {product.name}
          </Link>
        </h3>
        {view === 'list' && (
          <p className="mt-1 text-small text-oriel-slate">{product.shortDescription}</p>
        )}
        {/* Third chip is dropped on a phone. Two fit on one line at 155px;
            three wrap and push the price below the fold of the card. */}
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {product.keySpecs.slice(0, 3).map((spec, i) => (
            <li
              key={spec}
              className={cn(
                'rounded-pill bg-oriel-mist px-2 py-0.5 font-mono text-[0.6875rem] text-oriel-navy-ink',
                i === 2 && 'hidden sm:block'
              )}
            >
              {spec}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-3">
          <PriceBlock
            retailPrice={product.retailPrice}
            quoteOnly={product.quoteOnly}
            pricePerWatt={product.pricePerWatt}
            slug={product.slug}
          />
          <div className="relative z-10 mt-3">
            <AddToBasketButton
              product={{
                slug: product.slug,
                name: product.name,
                modelCode: product.modelCode,
                image: product.images[0]?.url ?? null,
                priced: product.retailPrice != null,
                quoteOnly: product.quoteOnly,
                outOfStock: product.outOfStock,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
