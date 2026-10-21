import { ImageResponse } from 'next/og';

/**
 * Default social preview card, drawn in the brand palette with the sun arc.
 * Product pages generate their own (see shop/[category]/[product]/opengraph-image).
 */
export const runtime = 'edge';
export const alt = 'Oriel Solar — solar panels, batteries and inverters in Kenya';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#061A46',
          padding: '64px',
          position: 'relative',
        }}
      >
        {/* The sun arc, rising from its green baseline */}
        <svg
          width="1200"
          height="300"
          viewBox="0 0 1200 200"
          style={{ position: 'absolute', bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="arc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#F26A21" />
            </linearGradient>
          </defs>
          <line x1="0" y1="190" x2="1200" y2="190" stroke="#3FA535" strokeWidth="4" />
          <path d="M 0 190 Q 600 -60 1200 190" stroke="url(#arc)" strokeWidth="6" fill="none" />
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: '#FDB913',
              fontWeight: 600,
            }}
          >
            Solar supply · Sizing · Installation — Nairobi, Kenya
          </div>
          <div
            style={{
              fontSize: 78,
              color: '#FFFFFF',
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 28,
              maxWidth: 900,
            }}
          >
            Power that doesn&apos;t ask permission.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            color: 'rgba(255,255,255,0.75)',
            zIndex: 1,
          }}
        >
          Oriel Power Ltd · orielpowerdm@gmail.com · 0723 204 342
        </div>
      </div>
    ),
    size
  );
}
