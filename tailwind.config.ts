import type { Config } from 'tailwindcss';

/**
 * Oriel Power Ltd — brand design tokens.
 * The palette derives entirely from the logo. No colour outside this set is
 * permitted anywhere in the interface (see MASTERPLAN Section 2.1).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Navy family — structure, headings, dark surfaces
        'oriel-navy': '#0B2A6B',
        'oriel-navy-deep': '#061A46',
        'oriel-navy-ink': '#0A1733',
        // Orange family — primary action
        'oriel-orange': '#F26A21',
        'oriel-orange-deep': '#D9541A',
        'oriel-orange-soft': '#FDEEE6',
        // Gold — the sun. Motif gradient, badges, step numbers
        'oriel-gold': '#FDB913',
        'oriel-gold-soft': '#FFF6E0',
        // Green family — SECONDARY BRAND COLOUR. Savings, sustainability,
        // WhatsApp/conversational actions, confirmations. Never primary commerce.
        'oriel-green': '#3FA535',
        'oriel-green-deep': '#2E7D28',
        'oriel-green-soft': '#EAF6E8',
        // Neutrals — all navy-derived, no warm tints
        'oriel-white': '#FFFFFF',
        'oriel-mist': '#F4F6FB',
        'oriel-line': '#DCE3F0',
        'oriel-slate': '#5A6784',
      },
      fontFamily: {
        // One familiar system sans site-wide, for a clear Pinterest-style feel.
        display: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-data)', 'ui-monospace', 'monospace'],
        // Back office only — Archivo, as Google Stitch sets these designs. The
        // variable is attached in the admin layout, so the fallback to the body
        // face is what the storefront would get if the class ever escaped.
        headline: ['var(--font-headline)', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid, clamp-based type scale (MASTERPLAN 2.2)
        display: ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        h1: ['clamp(2rem, 4.5vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.6rem, 3vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['1.25rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65' }],
        body: ['1rem', { lineHeight: '1.65' }],
        // `small` carries most of the running text on this site, so it sits at
        // 15px rather than the usual 14 — the difference is what makes a spec
        // list or a delivery note comfortable on a phone held at arm's length.
        small: ['0.9375rem', { lineHeight: '1.55' }],
        // Named steps below `small`, so captions and metadata stop being
        // arbitrary values scattered through the JSX.
        caption: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.8125rem', { lineHeight: '1.45' }],
        data: ['0.9375rem', { lineHeight: '1.4' }],
        eyebrow: ['0.75rem', { lineHeight: '1', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        input: '6px',
        card: '12px',
        pill: '999px',
      },
      boxShadow: {
        'oriel-rest': '0 1px 2px rgba(10,23,51,0.06)',
        'oriel-lift': '0 12px 32px rgba(10,23,51,0.12)',
      },
      maxWidth: {
        content: '1280px',
      },
      spacing: {
        // 4-based scale is native to Tailwind; add the larger poster steps
        '18': '4.5rem', // 72
        '30': '7.5rem', // 120
        // The admin's mobile shell, named rather than counted: the bottom bar
        // is a fixed 64px, and content clears it by 96px so the last row of a
        // list is never trapped underneath.
        nav: '4rem', // 64
        safe: '6rem', // 96
      },
      backgroundImage: {
        'sun-arc': 'linear-gradient(180deg, #FDB913 0%, #F26A21 100%)',
      },
      transitionTimingFunction: {
        'oriel-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'oriel-rise': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'oriel-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'oriel-rise': 'oriel-rise 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'oriel-fade': 'oriel-fade 400ms ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
