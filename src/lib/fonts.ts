import { Archivo, Public_Sans, IBM_Plex_Mono } from 'next/font/google';

/**
 * One sans for the whole site, headings included.
 *
 * The build previously set headings in Archivo with the width axis pushed to
 * 125 — wide and poster-like, and hard work to read on a phone, where a
 * headline turned into four ragged lines. The client asked for Jumia's
 * plainness instead: a single neutral sans everywhere, sized for reading
 * rather than for effect.
 *
 * Dropping Archivo also removes a whole variable-font download from every
 * first paint, which matters more here than it would elsewhere — most visitors
 * arrive on a mid-range Android over patchy 4G.
 *
 * 700 is loaded because headings use it. Without it the browser would
 * synthesise a fake bold, which smears at small sizes.
 */
export const fontBody = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

/**
 * Display face — the same family as the body. Kept as a separate export so
 * every call site does not have to change, and so a distinct display face can
 * be reintroduced in one place if the client ever wants one back.
 */
export const fontDisplay = fontBody;

/**
 * Back-office headline face — Archivo, at the four weights Google Stitch loads
 * for these designs (`family=Archivo:wght@400;500;600;700`). Matching Stitch
 * exactly was the point: page titles, card titles and figures are what carry
 * the "operational software" feel, and Public Sans set at 28px semibold does
 * not read the same way.
 *
 * Deliberately NOT the site-wide display face. Archivo was dropped from the
 * storefront on purpose — see `fontDisplay` above — because it cost a whole
 * extra download on a first paint that mostly happens on a mid-range Android
 * over patchy 4G. The admin is a repeat-visit tool behind a sign-in, so it can
 * carry the weight the shopfront could not. The variable is attached in
 * `src/app/admin/layout.tsx`, so only `/admin` ever downloads it.
 */
export const fontHeadline = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-headline',
});

/**
 * Data face — IBM Plex Mono. Prices, specs, order numbers and phone numbers.
 * Kept monospaced because figures in a column line up digit over digit, which
 * is what makes a spec table or a basket scannable.
 */
export const fontData = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-data',
});
