# Oriel Power Ltd — e-commerce platform

Solar hardware storefront for **Oriel Power Ltd** (trading as Oriel Solar),
Nairobi. Next.js 14 App Router, TypeScript, Tailwind, Supabase, M-Pesa.

> **Clean energy, More Savings, Brighter Tomorrow**

---

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (prerenders ~248 pages) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |

---

## Environment variables

Copy `.env.example` to `.env.local`. **`.env.local` is git-ignored and must
never be committed.**

### Required for the site to function

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, no trailing slash. Drives canonicals, the sitemap and order links in emails. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe in the browser — bound by Row Level Security. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Bypasses all security.** Server-only. Never give it a `NEXT_PUBLIC_` prefix. |
| `RETAIL_MARKUP_PERCENT` | Margin over dealer cost. **Without it, no product shows a price.** |
| `ADMIN_STAFF_KEY` | Staff passphrase for `/admin`. The admin refuses to load without it. |

### Required before taking real payments

| Variable | Notes |
|---|---|
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | From the Daraja portal. |
| `MPESA_SHORTCODE` | Paybill or Till number. |
| `MPESA_PASSKEY` | Lipa na M-Pesa Online passkey. |
| `MPESA_ENVIRONMENT` | `sandbox` or `production`. |
| `MPESA_CALLBACK_URL` | Public HTTPS URL of `/api/mpesa/callback`, registered with Safaricom. |

Leave the M-Pesa variables blank in development and a built-in simulator runs
instead — see `MPESA_SETUP.md`. It refuses to run when
`MPESA_ENVIRONMENT=production`.

### Required before customers get their receipts

| Variable | Notes |
|---|---|
| `RESEND_API_KEY` | Sends order confirmations, invoices, receipts and status updates. Unset, nothing is sent — every message is logged to `email_log` as `skipped` and printed to the console instead. |
| `EMAIL_FROM` | Must be on a domain **verified in the Resend dashboard**. `orielpower.com` is not verified yet, so every send currently fails with a 403 — see `EMAIL_SETUP.md`. |
| `EMAIL_REPLY_TO` | Where a customer's reply lands. Not a no-reply address. |
| `ORDER_NOTIFICATION_EMAIL` | The shop's own copy of every new order. |

### Optional

`AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME` (SMS has no transport yet —
the copy is written and logged to a file), `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.

---

## Database

Schema and policies live in `supabase/migrations/`. Apply them in order via the
Supabase dashboard's SQL Editor:

1. `0001_schema.sql` — tables, the `products_public` view, RLS policies, the
   pay-on-delivery trigger. **Safe to re-run; it drops first, so never run it
   against a database holding real orders.**
2. `0002_commerce_alignment.sql` — commerce table alignment.

Then load the catalogue:

```bash
node scripts/seed-supabase.mjs      # 259 products, 16 brands, 8 categories
node scripts/apply-pricing.mjs      # computes retail from RETAIL_MARKUP_PERCENT
```

**Re-run `apply-pricing.mjs` every time the markup changes.** It is idempotent.

### The pricing rule

```
retail = cost × (1 + markup%)  →  normalise to VAT-inclusive  →  round UP to KES 100
```

Solargen's list is VAT-inclusive, Livoltek's is VAT-exclusive, Lekkerix's does
not state — so Lekkerix products keep a null price and stay out of the public
view until their VAT basis is confirmed. Nothing ambiguous is ever published.

### How dealer cost is protected

`cost_price` lives only in the `products` table, which browser roles **cannot
read at all**. The storefront reads `products_public`, a view with no cost
column, and browser roles are granted access to the view only. Verified: the
anon key returns an empty result from `products` and full rows from the view.

**Never add a public select policy to `products`.**

---

## Project layout

```
src/app/                 Routes (App Router)
  admin/                 Staff dashboard, session-gated
  api/                   Route handlers — orders, M-Pesa, admin, intake forms
  shop/                  Catalogue, category listings, product pages
src/components/          UI, grouped by area
src/lib/
  supabase.ts            Two clients: publicClient (RLS) and serviceClient
  catalogue.ts           Storefront catalogue reads — server-only
  calculator.ts          Sizing engine (pure functions)
  mpesa/                 Daraja client, payments, rate limiting, logging
  orders/                Order persistence and notifications
  content/               Solutions, blog loader, markdown renderer
content/blog/            The eight articles, as markdown
data/                    Catalogue extraction scripts and source PDFs
supabase/migrations/     Schema and RLS
scripts/                 Seeding and pricing utilities
```

---

## Deployment (Vercel)

1. Push to GitHub and import the repository into Vercel.
2. Add every environment variable above under **Production**.
3. Set `NEXT_PUBLIC_SITE_URL` to the live origin (pick `www` or apex and keep
   it consistent — canonicals depend on it).
4. Deploy.
5. Register the production callback URL with Safaricom (`MPESA_SETUP.md`).
6. Place one small real M-Pesa transaction before announcing the site.

### Domain (orielpower.com)

`orielpower.com` and `www.orielpower.com` are attached to the `orielsolar`
Vercel project. The apex is canonical. DNS is authoritative at **Cloudoon**
(`ns1.cloudoon.com`, `ns2.cloudoon.net`, `ns3.cloudoon.org`), not at Vercel,
so the records are added in the Cloudoon control panel:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

Delete any existing `A`, `AAAA` or `CNAME` on `@` or `www` first — a parking
page record left in place will keep answering and the domain will never
verify. Vercel issues the TLS certificate automatically once the `A` record
resolves, usually within minutes of propagation.

Check progress with `npx vercel domains inspect orielpower.com`.

### Search indexing

`NEXT_PUBLIC_SITE_URL` is the origin every canonical, the sitemap, robots.txt
and all absolute links in email and SMS are built from. **On production it
must be `https://orielpower.com`.** It was unset once, and the live site spent
that period publishing `http://localhost:3000` as its canonical on every page
and in all 196 sitemap entries, which makes the whole catalogue unindexable.
`src/lib/site.ts` now falls back to the Vercel production host rather than
localhost, so the failure can only ever be cosmetic.

- Sitemap: `https://orielpower.com/sitemap.xml` (~196 URLs, hourly revalidate)
- Submit it in Search Console once the domain resolves, not before — a
  sitemap fetched on a domain that does not yet answer is recorded as failed.
- The Search Console property is a **Domain** property, verified by DNS `TXT`
  at Cloudoon. A Domain property can *only* be verified that way — the HTML
  meta tag does not verify one, it verifies a URL-prefix property. The tag is
  still emitted from `GOOGLE_SITE_VERIFICATION` as a second route in case a
  URL-prefix property is ever added.
- Metadata is evaluated at **build time**. Changing `GOOGLE_SITE_VERIFICATION`
  (or any variable read in `layout.tsx`) needs a fresh build to take effect —
  `vercel redeploy` restores Next's cached prerender and the old HTML comes
  back unchanged. Push a commit instead.
- Analytics is inert until `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set, so
  previews and local development never reach the client's reports.

### Before going live

- [ ] `RETAIL_MARKUP_PERCENT` set to the confirmed margin, and
      `apply-pricing.mjs` re-run
- [ ] `ADMIN_STAFF_KEY` changed from any development value
- [ ] Supabase service role key rotated if it has ever been shared
- [ ] Legal pages reviewed by a Kenyan advocate
- [ ] Remaining `{{PLACEHOLDER}}` values filled — see `PLACEHOLDERS.md`
- [ ] `next` upgraded to the latest patched 14.2.x
- [ ] Cloudoon DNS records added and `orielpower.com` serving over HTTPS
- [ ] Search Console property verified and the sitemap submitted
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` set, and a live visit confirmed in the
      GA4 realtime report
- [ ] Cookie consent decided with the advocate — GA4 sets cookies and Kenya's
      Data Protection Act 2019 applies (see `DECISIONS.md`)

---

## Documentation

| File | Contents |
|---|---|
| `DECISIONS.md` | Every judgement call, with reasoning |
| `PLACEHOLDERS.md` | Every unconfirmed value and who must answer it |
| `MPESA_SETUP.md` | Sandbox → production, callbacks, hardening |
| `EMAIL_SETUP.md` | Resend, invoices and receipts — **read this first: the sending domain is not yet verified** |
| `CONTENT_GUIDE.md` | How to edit products, prices, articles and projects |

---

## Conventions

- **UK spelling** throughout code, copy and content.
- **No colour outside `tailwind.config.ts`.** Navy builds the structure,
  orange drives the sale, green carries the savings and the conversation, gold
  is the sun. Green never sits on a primary commerce button.
- Server components by default; `'use client'` only where interaction demands it.
- Every number renders in IBM Plex Mono.

---

## What was verified

- Server recalculates every price — a request carrying `unitPrice: 1` for a
  KES 125,000 inverter was charged KES 125,000
- A pay-on-delivery order cannot reach `delivered` without a paid payment —
  refused by PostgreSQL even when bypassing the application entirely
- Three identical M-Pesa callbacks produce exactly one payment
- A dropped callback resolves as **paid** via the status-query fallback, not
  as a false failure
- No cost price, markup, service key or staff key appears in any client bundle
- Lighthouse: Accessibility 100, Best Practices 100, SEO 100
- No horizontal overflow at 360px; `prefers-reduced-motion` collapses every
  animation; all controls keyboard-reachable with visible focus rings
