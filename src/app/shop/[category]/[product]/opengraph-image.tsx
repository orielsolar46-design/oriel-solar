import { ImageResponse } from 'next/og';
import { getProduct } from '@/lib/catalogue';

/**
 * Per-product social card: brand, name, key specs and the VAT-inclusive price
 * in the brand palette. Prices are read through the same public catalogue the
 * page uses, so a quote-only product never leaks a figure here either.
 */
// Edge runtime: the Node runtime's bundled-font loader has a Windows path bug
// in Next 14 (ERR_INVALID_URL on a `file:\C:\...` path) that breaks local
// development. Edge resolves fonts differently and works on both platforms.
export const runtime = 'edge';
export const alt = 'Oriel Power product';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: { category: string; product: string };
}) {
  const product = await getProduct(params.product);

  const price =
    product?.quoteOnly || product?.retailPrice == null
      ? 'Request a quote'
      : `KES ${product.retailPrice.toLocaleString('en-KE')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          padding: '64px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#5A6784',
              fontWeight: 600,
            }}
          >
            {product?.brand ?? 'Oriel Power'}
          </div>
          <div
            style={{
              fontSize: 60,
              color: '#0B2A6B',
              fontWeight: 700,
              lineHeight: 1.1,
              marginTop: 20,
              maxWidth: 1000,
            }}
          >
            {product?.name ?? 'Solar equipment'}
          </div>
          {product?.keySpecs && product.keySpecs.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              {product.keySpecs.slice(0, 3).map((spec) => (
                <div
                  key={spec}
                  style={{
                    display: 'flex',
                    background: '#F4F6FB',
                    color: '#0A1733',
                    fontSize: 24,
                    padding: '10px 22px',
                    borderRadius: 999,
                  }}
                >
                  {spec}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingBottom: 28,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 52, color: '#0A1733', fontWeight: 700 }}>{price}</div>
            {product?.quoteOnly && (
              <div style={{ fontSize: 22, color: '#5A6784', marginTop: 6 }}>
                Priced per project
              </div>
            )}
          </div>
          <div style={{ fontSize: 24, color: '#5A6784' }}>Oriel Power Ltd · 0723 204 342</div>
        </div>

        {/* Brand arc, kept as a shallow flourish along the bottom edge so it
            never crosses the price or the contact line. */}
        <svg
          width="1200"
          height="44"
          viewBox="0 0 1200 44"
          style={{ position: 'absolute', bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="pArc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#F26A21" />
            </linearGradient>
          </defs>
          <line x1="0" y1="40" x2="1200" y2="40" stroke="#3FA535" strokeWidth="5" />
          <path d="M 0 40 Q 600 4 1200 40" stroke="url(#pArc)" strokeWidth="6" fill="none" />
        </svg>
      </div>
    ),
    size
  );
}
