import { ImageResponse } from 'next/og';

/**
 * Favicon drawn from the brand mark: the gold-to-orange sun arc rising from
 * its green baseline on the navy field. Generated rather than shipped as a
 * binary so it always matches the palette in tailwind.config.ts.
 */
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#0B2A6B',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <defs>
            <linearGradient id="i" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDB913" />
              <stop offset="100%" stopColor="#F26A21" />
            </linearGradient>
          </defs>
          <line x1="4" y1="24" x2="28" y2="24" stroke="#3FA535" strokeWidth="2.5" />
          <path d="M 5 24 A 11 11 0 0 1 27 24" stroke="url(#i)" strokeWidth="3.5" fill="none" />
        </svg>
      </div>
    ),
    size
  );
}
