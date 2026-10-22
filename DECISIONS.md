# Decisions log

Every judgement call made during the build, with reasoning. New entries are
appended; nothing is silently changed.

## Stage 1 — Foundation

### Tailwind v3, not v4
The brief specifies brand tokens in `tailwind.config.ts`. Tailwind v4 replaces
that file with a CSS-first `@theme` block, so we pinned **Tailwind v3.4** and
Next.js **14** to honour the brief exactly. All tokens live in
`tailwind.config.ts`; no arbitrary hex values appear in JSX.

### Display font — Archivo variable, expanded via the width axis
"Archivo Expanded" is not a separate family in the Google Fonts API. Archivo is
a single variable font carrying both weight and **width** axes. We load it with
`axes: ['wdth']` and set headings to `font-variation-settings: 'wdth' 125` in
`globals.css` (`.t-display`, `.t-h1`, etc.) to get the wide, industrial poster
weight the brief calls for — without a second web request or a fallback family.

### Typographic component classes
The fluid type scale is expressed as `.t-display / .t-h1 / .t-h2 / .t-h3 /
.t-eyebrow / .t-data` in `@layer components` rather than repeated Tailwind
utility strings. This keeps the width-axis setting in one place and makes usage
across pages consistent and auditable.

### Logo rendered from supplied raster
The client supplied the logo as artwork (JPEG). We use it directly via
`next/image` in the header, and place it in a white chip in the navy footer so
it reads on the dark base. A future vector version can drop in behind the same
`Logo` component. Sources recorded for Stage 2's provenance file.

### Package name
The project directory is `Orielsolar` (capitalised), which npm rejects as a
package name. `package.json` uses `oriel-solar`; the directory name is
unchanged.

### V2 brief adopted (2026-07-29)
The client issued a V2 masterplan superseding V1. Stage 1 was reworked to match:
three soft tints added (`orange-soft`, `gold-soft`, `green-soft`); green promoted
to a first-class brand colour (savings, WhatsApp/conversational actions,
confirmations — never primary commerce); the Sun Arc now rises from a 2px green
baseline and is permitted in five places (M-Pesa waiting modal added); the
header gains a 2px green hairline on scroll and a 2px orange underline on the
active nav item; the mega menu featured panel moved to green-soft; the mobile
drawer gained a fixed bottom panel with a green WhatsApp button and a mono
phone row; the footer gained the green eco strip; `/projects/[slug]` added.

### Pending — Next.js security patch
`next@14.2.15` carries a known advisory (2025-12-11). The upgrade to the latest
patched `14.2.x` was attempted but blocked by an intermittent network drop on
this machine. It does not affect local Stage 1 review. **Action before deploy
(Stage 10):** `npm install next@^14.2.33 eslint-config-next@^14.2.33`.

## Stage 2 — Catalogue data

### Cost price column selection
Where a list carries two price columns, the **dealer column** is stored as
`cost_price` per the brief: Livoltek "Dealer Price -L2", Solargen "Dealer
price". Lekkerix quotes a single price (it is a quotation to Oriel) — that is
the cost. Livoltek BOS/lights carry a single pre-VAT price; used as cost.

### VAT normalisation
Solargen July 2026 states VAT-inclusive (16%) → `source_vat_inclusive: true`.
Livoltek states NOT inclusive → `false`. Lekkerix is silent → `null`, and all
37 of its SKUs are `price_status: needs_review` per the brief. Retail is
derived in Postgres by `compute_retail_price()`: cost × (1 + markup%) →
VAT-normalise → round **up** to the nearest KES 100. It returns null when VAT
status is unknown, so nothing ambiguous can publish.

### Eighth category: balance-of-system
The mega menu's column 4 links "Balance of system →", but breakers, SPDs,
combiner boxes, distribution boards and cables belong to none of the seven
named categories. They are grouped under an eighth catalogue category
`balance-of-system` reachable from that existing link. Mounting rails and
clamps sit under Solar Panels → "Mounting & rails" as the menu specifies.

### Victron charge controllers under Inverters
The menu has no charge-controller destination; Victron MPPTs are filed under
`inverters/charge-controllers`. Alternative was balance-of-system; controllers
are closer to power conversion than to protection hardware.

### Per-watt panel lines expanded to SKUs
Horay is quoted at KES 18/W across eleven listed wattages; TW Solar at 16–17/W
for two modules. Each wattage is a SKU with `cost_price = wattage × rate` and
`cost_per_watt` retained so the arithmetic is auditable and the PDP can show
the per-watt figure the brief requires.

### "Three-phase" menu link is a filter, not a subcategory
Inverters are subcategorised by type (hybrid / off-grid / grid-tied /
all-in-one ESS / charge-controllers); phase is a spec facet. The menu's
"Three-phase" link will target `/shop/inverters?phase=three` when filters land
in Stage 3, avoiding double-homing SKUs.

### Spares loaded unpublished
Pump ends, controller mainboards, spare tanks/collectors/tubes, battery wheels
and foot pads are loaded `is_published: false` per the brief ("skip pure
spares… but load them unpublished").

### Quote-only threshold derived, not stored
"Request a quote above KES 500,000" is computed on retail price in the
`products_public` view (`quote_only` flag, price nulled), so a markup change
can never strand a stale flag.

### Stitch project used as layout reference only
The client's Stitch project ("Oriel Solar Design System", ~70 screens) is the
visual reference for page composition. Its design-system file drifts from the
brief in places (Archivo **Narrow** headings, Material-derived surface tints
outside Section 2.1). The brief's Section 2 is non-negotiable and the client
confirmed "do not switch our colours", so the code keeps the brief's tokens
and Archivo Expanded; Stitch screens guide layout, not palette.

## Stage 2 rollout + Stage 3 — Storefront

### Series photography assigned per model family
Manufacturer product pages publish one gallery per model family (e.g. the
Livoltek GT3 4–25kW series), not per rating. Family galleries were verified
visually and assigned to every SKU in that family, with alt text marking them
"official series photograph". 65 published SKUs carry official imagery; the
remaining 168 (small BOS hardware, pumps, brands with no retrievable assets)
render the sun-arc placeholder and are logged in PLACEHOLDERS.md.

### `server-only` package added
The storefront reads `data/products.json` through `src/lib/catalogue.ts`,
which imports the `server-only` marker (official Next.js companion, zero
runtime). Any accidental client-side import of catalogue internals now fails
the build instead of leaking cost pricing. Verified: no cost figure, supplier
name or pricing note appears in any client chunk or rendered HTML.

### Interim data source until Supabase is provisioned
`lib/catalogue.ts` reproduces the `products_public` view contract in
TypeScript (cost stripped, retail derived, > KES 500,000 becomes quote-only).
When the Supabase project is provisioned (Stage 6), the module's internals
switch to querying the view; its public API and every page stay unchanged.

### Honest unpriced state
`RETAIL_MARKUP_PERCENT` is unconfirmed, so no retail price can exist yet.
Rather than inventing a figure for preview, cards and PDPs render "Price
being confirmed" with a request-a-quote path, and Add to basket is replaced
by the quote CTA. The moment the client confirms the markup in `.env.local`,
prices, VAT lines, per-watt figures and basket actions appear with no code
change.

### Basket primitive ahead of Stage 6
Add-to-basket, quantity stepper and the header badge store lines (slug and
quantity only — never prices) in localStorage. Server-side cart persistence,
the cart page and checkout remain Stage 6 scope; the server will recalculate
all pricing at order time per the brief.

### Filter rail: numeric price inputs instead of a slider
The brief sketches a capacity/price range slider. URL-reflected filtering is
implemented with mono numeric min/max inputs (better on mid-range Android,
no JS slider dependency). Capacity filtering is served by the Type facet plus
search. If the client wants true sliders, that is a Stage 10 polish item.

### Phase is a facet, not a subcategory
"Three-phase" in the mega menu links to `/shop/inverters?phase=three`. Phase
is detected from the specification text server-side, so three-phase hybrids
appear under both Hybrid and Three-phase without double-homing SKUs.

## Stage 3 completion + Stage 4 — Home page

### Search is an overlay
The header search icon now opens a focus-trapped overlay (Escape closes,
focus returns to the trigger) that submits to the server-rendered `/search`
results page — satisfying both the "search overlay" requirement and
indexable results.

### PDP gained the category FAQ accordion and the contact band
Category-scoped FAQs (three per category, written as genuine buying guidance
with no invented figures) and the shared deep-navy contact band now close out
every PDP per brief 7.3.

### Contact intake is interim-local
`POST /api/contact` validates with zod and appends to a git-ignored
`data/dev-messages.json` so the call-back form works end to end in
development. Stage 6 swaps the store for the Supabase `contact_messages`
table and adds the admin email — the route contract is unchanged.

### Home blocks 10 and 11 render conditionally, not fake
Recent installations stays hidden until `{{PROJECT_PHOTOS_AND_DETAILS}}`
arrives; the guides grid appears when the Stage 9 blog articles exist.

### Green band statistics withheld
The four figures are `{{SAVINGS_BAND_STATISTICS}}` and the brief forbids
inventing them, so the band ships with its headline, three benefit columns
and CTA; the statistics row renders once the client supplies the numbers.

### Solution cards ship without "From KES" lines
Starting prices depend on the unconfirmed markup and on bundle compositions
the client has not yet agreed. Logged as `{{SOLUTION_STARTING_PRICES}}`;
the line renders once confirmed.

### Brands row uses styled wordmarks
Official logo files are not yet licensed/supplied; greyscale wordmarks in the
display face stand in (slate, colouring on hover) and `{{BRAND_LOGOS}}` is
logged. Swapping in image logos is a template-only change.

### Calculator teaser assumptions
The compact teaser uses deliberately conservative, stated assumptions —
KES 30/unit effective tariff, 5.0 peak sun hours (the low end of the Kenyan
range), 65–75% bill offset by profile — and rounds the saving DOWN to the
nearest KES 100. Every figure is labelled an estimate and the full Stage 5
calculator will state each assumption in its "How we worked this out" panel.

## Stage 5 — Sizing calculator

### Conservative by construction
Equipment sizes round UP (0.5kW / 0.5kWh steps), savings and generation round
DOWN, payback rounds UP, and generation is capped at what the user actually
consumes. Every constant (KES 30/unit tariff, 20% system derating, 90%
usable LiFePO4 depth, per-county sun hours) is surfaced verbatim in the
"How we worked this out" panel, which ends with the brief's mandated honesty
line.

### County sun hours are regional estimates
The brief instructs a county dropdown driving 5.0–5.8 kWh/m²/day. Counties
are grouped regionally (arid north and coast at the top of the range, cool
highlands at the bottom) and the exact figure used is displayed beside the
dropdown before the user continues. A site survey confirms the final design.

### Catalogue mapping is server-side and pairing-safe
`POST /api/calculator/quote` selects SKUs on the server: the inverter first
(smallest suitable, right type and phase, best stock), then panels by
quantity, then the battery **only from that inverter's curated
compatible_with list** — the calculator can never recommend a mismatched
voltage class. Protection hardware comes from the same links. In-stock items
outrank higher-spec out-of-stock ones.

### Estate lighting short-circuits the electrical flow
Lighting projects are pole-count driven, not kWh driven. The estate profile
skips the load and goal steps, asks only for location, and offers the street
light range with a survey/quote path instead of pretending a kWh sizing.

### Swap links go to filtered listings
Each quote line's "Swap" opens the relevant filtered category listing rather
than an inline picker — one tap on mobile, and the listing already carries
the full filter UI. An inline swap picker is a possible Stage 10 enhancement.

### Lead capture interim store
`POST /api/calculator/lead` validates and appends to git-ignored
`data/dev-calculator-leads.json`; Stage 6 moves it to the Supabase
`calculator_leads` table with the Resend sizing email. Contract unchanged.

## Stage 6 — Commerce

### Sample markup in `.env.local` so the machinery is testable
`RETAIL_MARKUP_PERCENT=25` is set in the git-ignored `.env.local` **purely so
checkout can be exercised end to end in development**. The file states in a
comment that this is not the client's margin. `{{RETAIL_MARKUP_PERCENT}}`
remains a launch blocker in PLACEHOLDERS.md and must be set in the production
environment before any price is published.

### The browser never sends a price
`POST /api/orders` accepts slugs and quantities only. Every unit price is
re-read from the catalogue server-side; unpriced and quote-only items are
rejected with a clear message rather than guessed at. Verified by test: a
request carrying `unitPrice: 1` for a KES 125,000 inverter was charged
KES 125,000.

### Delivery fee is null, not zero
`{{DELIVERY_RATE_CARD}}` is unconfirmed, so delivery orders store
`deliveryFee: null` and every surface says "confirmed before dispatch".
Collection stores `0` and displays "Free" in green. Inventing a zero fee
would silently under-charge the client.

### Order store mirrors the Supabase schema
`src/lib/orders/store.ts` is a file-backed store with the same states, order
number format (`ORL-{YYMM}-{5-digit}`), event log and constraints as
`supabase/migrations/0001_schema.sql`. **The COD rule is enforced here
exactly as the database trigger enforces it**: a `pay_on_delivery` order
cannot reach `delivered` without a `paid` payment row. Verified by test —
blocked twice while unpaid, allowed only after the payment was recorded.

### SMS copy is GSM-7 constrained
A single em dash or × switches an SMS to UCS-2 encoding, cutting the segment
from 160 characters to 70 and multiplying the cost of every notification.
SMS bodies pass through a `gsm7()` normaliser; email keeps full typography.

### Order page is token-guarded, lookup is non-enumerable
`/order/[orderNumber]` requires the `token` query parameter to match the
order's access token. `/track-order` looks an order up by number **plus** the
phone it was placed with, and returns one generic message for both "no such
order" and "wrong phone" so sequential order numbers cannot be enumerated.

### Checkout chrome is simplified in the shared layout
The header renders a logo-and-secure-checkout variant on `/checkout` and the
footer is hidden there, rather than giving checkout its own route group.

## Stage 7 — M-Pesa

### Deviation: per-IP rate limit is 40, not 5
The brief specifies 5 STK pushes per 15 minutes per IP **and** per phone.
**Per phone is 5, exactly as specified** — that is the precise anti-abuse
control. Per IP is set to 40 because Kenyan mobile networks place large
numbers of subscribers behind carrier-grade NAT: many unrelated customers
share one public address, and a 5-per-IP rule would block genuine buyers
whose only mistake was using the same network as someone else. 40 still stops
scripted abuse from a single host. **This is the one place the build departs
from the brief's stated number; the client can overrule it in one constant.**

### Simulator mode so both flows could be built and demonstrated
Daraja credentials do not exist yet. Rather than stub the integration, the
client module runs a simulator when credentials are absent, emulating
Daraja's shapes, timing and failure codes — outcome selected by the last
digit of the paying phone number. This let all four required scenarios plus
the dropped-callback case be demonstrated now. **`isSimulated()` throws when
`MPESA_ENVIRONMENT=production`**, so simulation can never run against real
money. Real credentials switch the code path with no other change.

### Resolution comes from the callback; the fallback is real
`/api/mpesa/status/[id]` returns `pending` until the callback lands. After
150 seconds with no callback it runs `queryTransactionStatus` **before**
declaring any failure, exactly as the brief requires. Verified: a transaction
that succeeded at M-Pesa but whose callback never arrived resolved as
**paid**, not as a false failure.

### COD payment does not change the order's delivery state
When a pay-on-delivery payment succeeds, the payment row becomes `paid` but
the order stays in its delivery state (`pending_cod` / `out_for_delivery`).
Money arriving does not move goods; staff mark `delivered` at handover, and
the database rule then permits it because a paid payment exists.

### Callback route swallows its own errors by design
`/api/mpesa/callback` always answers `{"ResultCode":0,"ResultDesc":"Accepted"}`
with HTTP 200 — including when our processing throws. A non-200 makes Daraja
retry indefinitely. Internal failures are written to the M-Pesa log and
handled out of band.

### Interim staff auth on the COD trigger
Supabase Auth arrives with the Stage 8 admin dashboard. Until then the COD
endpoint requires `x-staff-key` matching `ADMIN_STAFF_KEY`, and **returns 503
when that variable is unset** so it cannot be accidentally left open.

### Simulator state is file-backed
Next.js recompiles route handlers independently in development, which gave
the push route and the status route separate copies of an in-memory map and
stranded the first transaction after a restart. Simulator state now persists
to a git-ignored file so demonstrations are reproducible.

## Stage 8 — Admin dashboard

### Interim auth is a signed session, not a header
Supabase Auth with `admin`/`staff` roles is the target and its schema already
exists (`staff_profiles`). Until the project is provisioned, staff sign in
with a shared passphrase (`ADMIN_STAFF_KEY`) and receive an **HMAC-signed,
httpOnly cookie**. The passphrase is never stored in the cookie — only a
signed expiry — comparisons are timing-safe, sign-in is throttled to 8
attempts per IP per 10 minutes, and **every admin route refuses to work when
`ADMIN_STAFF_KEY` is unset**. Verified: forged cookies are rejected.

### Two-layer gate
Middleware redirects any `/admin` request without a session cookie and stamps
`X-Robots-Tag: noindex`. The cryptographic verification happens in the page
itself, because the Edge runtime has no `node:crypto`. A forged cookie passes
middleware and is then rejected by the page — verified.

### Mobile-first, because of where it is used
The brief is explicit that the COD screen is operated one-handed at a
customer's gate. Navigation is therefore a thumb-reachable bottom bar on
phones, the payment button is 56px tall, the amount renders at display size,
and the M-Pesa receipt appears large with one-tap copy so staff can read it
back. The dashboard leads with action queues (out for delivery, COD owed,
awaiting payment) rather than vanity metrics.

### Margin is computed VAT-exclusive on both sides
Retail is VAT-inclusive and dealer costs are mixed (Solargen inclusive,
Livoltek exclusive). Comparing them raw would misreport margin, so both sides
are normalised to ex-VAT before the margin is taken. Worked example: dealer
KES 100,000 inclusive → retail KES 125,000 inclusive → margin KES 21,552 at
+25%, not the +25,000 a naive subtraction would show.

### Price import previews but does not yet write
The wizard parses CSV, maps columns and produces the full
New / Price changed / Unchanged / Skipped diff with old and new retail
computed through the real pricing rules. **Apply is deliberately not wired to
a write**: the catalogue is currently a generated file
(`data/build_catalogue.py`), and silently diverging the JSON from its
generator would be lost on the next rebuild. The endpoint returns the exact
diff that will be applied once the products table exists.

### Not built in this stage, and why
Quote-request management, and blog/project CRUD, are listed under admin in
the brief but depend on Stage 9 content work (`/request-a-quote` has no
submission handler yet, and there are no posts or projects to manage). They
follow in Stage 9 rather than shipping as empty shells.

## Stage 9 — Content

### Articles are markdown files, not database rows
The eight launch articles live in `content/blog/*.md` with frontmatter, so
the client can edit them in any text editor and see the change on the next
deploy. A small in-house markdown renderer (`src/lib/content/markdown.ts`)
covers exactly the subset used — headings, paragraphs, lists, bold, italic,
inline code, links, blockquotes — rather than adding a parser dependency for
content we author ourselves. It returns React nodes, so nothing is ever
`dangerouslySetInnerHTML`-ed.

### Solutions pages lead with what the system will NOT do
Each of the five pages carries an explicit "What it will not do" panel on
gold-soft. This is deliberate: the brief's competitive position is technical
credibility, and stating limits plainly is what separates an engineering
supplier from a shop. It also pre-empts the disappointment that follows an
oversold system.

### Legal pages are drafts, and say so
Terms, privacy and delivery/returns are written as complete working drafts
with `{{...}}` placeholders where client facts are needed, and each ends
with a visible note that a Kenyan advocate should review before launch. The
privacy policy is written against the Data Protection Act, 2019. **These are
not a substitute for legal advice and the site should not go live on them
unreviewed.**

### Projects list ships deliberately empty
`src/lib/content/projects.ts` exports an empty array. The projects page
explains that photographs are being gathered with customers' permission and
offers to put enquirers in touch with real customers, rather than showing
stock photography of someone else's work. The home page block stays hidden.
Adding a real project is a single array entry.

### One quotation intake, three kinds
`/request-a-quote`, the site-survey booking and warranty registration all
post to `POST /api/quotes` with a `kind` discriminator, so staff see one
queue in `/admin/quotes` rather than three. Interim file store as elsewhere.

## Supabase migration (2026-07-31)

### Two clients, two privilege levels
`src/lib/supabase.ts` exposes `publicClient()` (anon key, bound by RLS — used
by the storefront) and `serviceClient()` (service role, bypasses RLS — orders,
payments, admin). Both are behind `server-only`, so importing either from a
client component is a build error rather than a silent key leak.

### The security boundary is the view, and it is asymmetric
The browser roles are granted `select` on `products_public` and **deliberately
not on `products`**. Verified against the live database: the anon key returns
`[]` from `products` (no policy matches) and full rows from the view — so
dealer cost is unreachable from the browser even with the public key in hand.

### Catalogue is fetched once per request, filtered in memory
The published catalogue is a few hundred rows, so `getCatalogue()` is wrapped
in React's `cache()` and every filter/sort/facet runs in memory. One query per
render regardless of how many components ask for products.

### Retail price is stored, not computed per request
`scripts/apply-pricing.mjs` writes `retail_price` and `price_per_watt` using
the agreed rules (markup → VAT normalisation → round up to KES 100). The
public view filters on `retail_price is not null`, so anything unpriced or
VAT-ambiguous stays invisible automatically. **Re-run that script whenever
`RETAIL_MARKUP_PERCENT` changes** — it is idempotent. Current state: 221
priced, 38 left null (the Lekkerix items whose VAT basis is unconfirmed),
198 visible publicly.

### Order items store a slug, not a foreign key
An order is a historical record and must survive a product being unpublished,
renamed or deleted. Name and unit price are snapshotted on the row for the
same reason.

### `delivery_fee` is nullable on purpose
Null means "priced per zone, confirmed before dispatch", which is the truth
until `{{DELIVERY_RATE_CARD}}` is agreed. Storing 0 would silently
under-charge the client.

### Supabase row types are permissive for now
Generated types (`supabase gen types typescript`) need the CLI linked with an
access token, which we do not have. The client uses a permissive schema
generic; column names are checked by hand against the migrations, and the
mapping layers in `lib/catalogue.ts` and `lib/orders/store.ts` convert rows
into strongly typed application objects, so the untyped surface is confined
to one file. **Follow-up: generate real types once the CLI is linked.**

### The COD guarantee was verified at the database level
A `pay_on_delivery` order was forced toward `delivered` **using the service
role key, bypassing the entire application**, and PostgreSQL refused it:
`COD order ORL-2607-00003 cannot be delivered without a paid payment`. The
rule is in the database, not just in application code.

## Stage 10 — Polish and ship

### Contrast failures found and fixed — including two against our own rules
Lighthouse found 24 contrast failures. Five distinct causes, and two of them
broke rules stated in the brief itself:

| Was | Ratio | Fix |
|---|---|---|
| Orange link text on white | 3.06 | Navy text with an orange arrow — the brief's own instruction for small orange text |
| Gold step numerals on white | 1.73 | Gold on a navy chip; gold on white fails at any size |
| Gold eyebrow on deep green | 3.20 | Gold-soft |
| White on `--oriel-green` | 3.16 | `--oriel-green-deep`, exactly as brief §2.3 says |
| `white/40` and `slate/60` body text | 3.7 / 2.5 | Raised to `/70` and full slate |

Result: **Accessibility 100, Best Practices 100, SEO 100** on both the home
page and a product page.

### Product pages are prerendered
Every product page was server-rendering on demand, so each visit waited on a
database round-trip. `generateStaticParams` now prerenders all 198 published
products with hourly revalidation. TTFB dropped from ~600ms to **40–90ms**,
and the build went from 50 to 248 static pages.

### Performance could not be measured reliably on this machine
Identical builds scored between 67 and 88, with Total Blocking Time swinging
241ms → 680ms across runs, on a machine sitting at 45–56% CPU from other work.
TTFB (40–91ms) and CLS (0.00) are consistently excellent; LCP measured
2.8–3.7s against a 2.5s target.

**This is not a verified pass.** The structural fixes are done; the remaining
figures need re-measuring on Vercel, where pages are served from a CDN rather
than a busy Windows laptop. Flagged rather than claimed.

### Real bug found at 360px
`/shop` overflowed horizontally by 48px: the sort control and view toggle
could not share a line with the result count. Fixed by letting that group
wrap and capping the select width. Verified across five pages at 360px, all
clean.

### Keyboard and reduced-motion verified with real browser events
`element.focus()` does not trigger `:focus-visible`, so an earlier check was
inconclusive. Re-tested by dispatching genuine Tab keypresses over the Chrome
DevTools Protocol: 14 controls reached, **every one showing a visible focus
ring**. With `prefers-reduced-motion: reduce` emulated, **zero** elements
retained an animation or transition.

### Security headers added
`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a
`Permissions-Policy` denying camera, microphone, geolocation and FLoC.
Product imagery is served immutable for a year.

### Favicon and OG cards are generated, not shipped as binaries
Both are drawn from the brand tokens with `next/og`, so they can never drift
from the palette. The product card renders brand, name, key specs and the
VAT-inclusive price — and shows "Request a quote" for quote-only items, so a
private price cannot leak through a social preview.

The product OG route runs on the Edge runtime: the Node runtime's bundled-font
loader has a Windows path bug in Next 14 that breaks local development.

## Launch: domain, analytics and search indexing (2026-08-03)

**The site URL was the single largest defect found at launch.**
`NEXT_PUBLIC_SITE_URL` was never set on the Vercel production project, and
every consumer of it inlined a `?? 'http://localhost:3000'` fallback. The
consequence was live and public: `robots.txt` advertised
`Sitemap: http://localhost:3000/sitemap.xml`, all 196 sitemap entries pointed
at localhost, and every canonical and `og:url` did the same. A crawler
following any of it reaches nothing, so the catalogue could not have been
indexed at all, however good the rest of the SEO was.

Fixed in two places, because either alone would have left the trap armed:

1. The production environment variable is now `https://orielpower.com`.
2. `src/lib/site.ts` is the single source of truth. When the variable is
   missing it falls back to Vercel's injected production host rather than to
   localhost, so the worst case is an unbranded but real URL. `robots.ts`,
   `sitemap.ts`, `layout.tsx`, the product page and order notifications all
   read from it now.

**Domain.** `orielpower.com` and `www.orielpower.com` are attached to the
`orielsolar` Vercel project. The apex is canonical because that is the form
the client gave; `www` is kept attached so it resolves and redirects rather
than failing. DNS is authoritative at Cloudoon, not Vercel, so the records
must be added there by hand — see README.

**Google Analytics 4** is an addition to the brief, requested by the client on
2026-08-03. `src/components/analytics/google-analytics.tsx` renders nothing
unless `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set, so development and preview
deployments stay untracked and the client's reports are never polluted by our
testing. Both tags load `afterInteractive`: the brief's ≥90 performance
budget is measured on a mid-range Android, where loading the tag manager
before hydration costs real blocking time.

**Search Console** verification supports both methods. The DNS TXT route needs
no code. The HTML-tag route reads `GOOGLE_SITE_VERIFICATION` and is simply
absent when unset.

**Structured data corrections.** Product JSON-LD listed images by
site-relative path (`/products/…`), which Google cannot resolve — the
photography was invisible to shopping results. Now absolute. An offer is also
now suppressed for quote-only products: previously any non-null retail price
was marked up even when the page deliberately hid it, which both leaked the
figure and contradicted the visible page. Added `mpn`, `category`, `url`,
`itemCondition`, `seller` and the warranty term where one is known.

Category pages had no structured data at all and now carry `BreadcrumbList`
and an `ItemList` of the products actually rendered.

**Sitemap `lastmod`.** Every entry used to carry the moment the sitemap was
regenerated. On an hourly revalidate that told Google all ~200 pages change
every hour, which is false; Google discards a lastmod it learns to distrust.
Only the guides carry one now, from their real publication date.

`/search` is now `noindex, follow` — Google's own guidance is that internal
search results should not be indexed, and an unbounded `?q=` space would
otherwise generate limitless thin pages competing with the category and
product pages. `/shop` gained the canonical it was missing, so filter, sort
and page query strings no longer each become an indexable duplicate.

## Which name the site trades under (2026-08-03)

The client asked for **Oriel Solar** to be prominent. The company is
registered as Oriel Power Ltd and trades as Oriel Solar, and the supplied
logo artwork reads "ORIEL POWER LTD", so the two names cannot simply be
swapped. The client chose the search-facing option: page design untouched,
trading name leading everywhere a search engine or a browser tab shows it.

Changed: the title default and template, `applicationName`,
`openGraph.siteName`, the home/about/contact titles, the shop, search,
projects, track-order and warranty descriptions, and the social card `alt`.

Unchanged, deliberately: the header and footer logo, the footer copyright
line, the About page introduction, and the order and notification copy. The
logo's `alt` still reads "Oriel Power Ltd" because that is what the artwork
depicts — alt text describes the image, it is not a branding slot.

The two schema nodes name the two things they actually describe, which is why
they disagree:

- `Organization` (root layout) — `name` Oriel Power Ltd, `alternateName`
  Oriel Solar. This node is the legal company.
- `WebSite` (home page only, per Google's guidance) — `name` Oriel Solar,
  `alternateName` Oriel Power Ltd. This node is the site, and it is the one
  Google reads to decide the name printed above the URL in a result.

Legal pages, invoices and order notifications keep the registered name. That
is not a style choice — a customer's receipt has to name the company that
took their money.

## The back office stops wearing the shop's clothes

**The storefront header and footer were rendering on every admin page.** The
root layout mounted both unconditionally, and the only gate that existed hid
the footer on `/checkout`. So the back office carried a customer navigation bar
above its own rail — two navigations, one on top of the other — and closed a
stock table with a customer-facing sitemap and a WhatsApp button. That was a
plain bug, not a style choice.

`SiteChrome` replaces `HideOnCheckout` and gates both slots: nothing on
`/admin`, and no footer on `/checkout` as before. One known cost, left in
deliberately: because the gate is a client component receiving the chrome as
children, React still renders the footer on the server and serialises one copy
into the flight data for each admin request before the client discards it. The
fix for that is a `(site)` route group, which is the idiomatic answer but moves
eighteen route folders and changes which layout the global 404 renders inside.
Not worth bundling into a visual pass; worth doing on its own.

**The rail is now light.** The old deep-navy rail was justified on the grounds
that a dark chrome separates back office from storefront at a glance. That
argument was doing real work when the two shared a header — it no longer has
to, because the storefront's chrome is gone from these routes entirely. The
rail is white on the mist page, and the active item is a filled navy pill with
a chevron rather than a gold tick against a dark surface. Navy is the brand's
structural colour and it does here what the reference does with its own
primary: one saturated shape on a quiet panel, so "where am I" is answered
before a word is read.

**Three colours carry meaning, and only three.** Navy for structure and the
active state, green for good news, orange for anything that wants a human. Gold
keeps the sun motif and stays out of the furniture. That is what stops a
dashboard of nine tinted discs turning into a paint chart.

**The chart is one SVG path, not a charting library.** A cardinal spline with a
gradient falling away underneath, rendered on the server, tension held at 0.18
because anything higher overshoots on a spiky series and draws a curve that
dips below zero orders — a lie about the data. Hover detail is a `<title>` in a
transparent hit column per point: not pretty, but it works without JavaScript
and screen readers announce it, which a custom div would not.

**Trend badges are computed, not decorated.** Week-on-week comes from the
14-day series the dashboard already loads, and it is suppressed entirely when
the earlier week was empty. Going from nothing to something is not "+100%", it
is the first week, and a percentage against zero is exactly the figure that
gets repeated in a meeting and then cannot be defended. With today's data no
badge renders at all, which is the correct output rather than a missing one.

**The topbar search is real.** It submits to `/admin/products`, which already
reads `?q=` across name, brand and model code. The reference has a search field
beside the page title; a box that looked like search and did nothing would have
been worse than no box. It also carries sign-out, because the rail becomes a
bottom bar on phones and has nowhere to put it.

Sign-in keeps its deep-navy full-bleed panel. It is the one screen where the
boundary still has to be stated in paint, because there is no rail yet to state
it in structure.

## Photography for the back office "needs a look" list

Sixteen of the twenty-five flagged rows now carry a photograph, plus three more
Horay panels in the same state the list did not reach — nineteen products,
twenty images. `data/harvest_needs_a_look.py` records the source URL for each
and the reason against every one it refused;
`scripts/apply-needs-a-look-imagery.mjs` pushes them.

Three of the earlier "no public product photography found" verdicts were simply
wrong, and the note in PHOTOGRAPHY-NEEDED.md now says so. Solargen run a
WooCommerce store that photographs the breakers per amperage. Growatt's site
responds perfectly well. Horay publish one photograph per N-Type series. The
Lithium Valley CDN does serve assets — it is the product pages that are
JavaScript-rendered, so the files come from the WordPress media API or the
datasheet PDFs instead.

**The label is what decides whether a photograph fits.** Solargen's breaker
shots are legible: the 250A reads "BDM-250 / In 250A" and the 16A reads "16A".
That makes them exact matches for those ratings and disqualifies them for the
neighbouring ones, which is why the 200A is still a gap while the 63A is not —
ZJ Beny's own 2-pole shot carries a "B63" label, so it is that part. The
alternative, showing a unit labelled 250A on a 200A listing, is the sort of
thing a customer notices after it arrives.

**Panels take the series photograph whose band contains the wattage.** This
follows the rule already set for the Livoltek and Jinko families. Horay publish
bands, not per-wattage shots, so 440W and 450W both take HS182-108TC-D-Ocean
(430~450W). Where no band contains the wattage, the nearest band within 25 W is
used — one cell row of tolerance — and the alt text says "series photograph"
rather than claiming a per-model shot. 350W is 80 W below anything Horay
publish as N-Type and gets nothing.

**Imagery does not publish a product; a price does.** The apply script keeps
the existing rule, so the fourteen unpriced rows gained a photograph and stayed
unpublished. Only the five Solargen breakers were already priced, and they were
already live — they were the "live but unbuyable" half of the flag, and now
they have something to show.

Two rows are misnamed rather than unphotographed, and both are noted in
PHOTOGRAPHY-NEEDED.md for the client to settle: Growatt list no "SPF 12000 ES"
(their ES line stops at 6kW, so it is almost certainly an SPF 12000T DVM), and
the "Deye Mobile Energy Storage System 12kW" is a Lithium Valley LV-MAST-T12K-A
filed under the wrong brand. Both are unpriced, so neither can reach a customer
before someone confirms them.

**Transparent sources are flattened onto white.** The Chloride pass kept alpha;
this one does not, because the product card renders `object-contain` on
`bg-oriel-white` and a white matte is what the card shows anyway. It also keeps
the webp smaller.

## Invoicing, receipts and email (2026-08-07)

### The document is its own record, not a view of an order

Two thirds of this company's trade walks through the door. Those customers
never place an order, so there is no order row to render a receipt from — a
design that derived documents from orders would simply have nothing to show for
most of the business. `documents` is therefore a first-class table holding a
full snapshot: customer, lines, VAT treatment and totals, copied in at issue and
never read back through a join.

The snapshot is the point. A receipt is a legal record of what was charged on
the day; if a product's price changes next month, a reprint must not change with
it. Web orders get a document too, generated from the order, so both halves of
the business are receipted from one screen and numbered in one series.

### Two VAT modes, because the shop and the pad disagree

Every price in the catalogue is VAT-INCLUSIVE retail. The printed pad is filled
in VAT-EXCLUSIVE with the tax added underneath. Both are right, and converting
between them would have been the wrong fix: a document raised from a web order
carries `vatMode: 'inclusive'`, so its line prices are exactly the prices the
customer saw on the site and the summary backs the VAT out of them. Converting
to net would have printed line prices that no longer matched the website, and
the customer's first act would have been to ring and ask why.

The VAT split is computed from the total, never accumulated line by line.
Sixteen per cent of each of five lines, each rounded, does not reliably sum to
sixteen per cent of their total, and a receipt whose VAT column is a shilling
out from the tax actually remitted is a receipt that causes an argument.

### The line total is editable

It defaults to quantity × unit price and stops being derived the moment a clerk
types over it. That is not a loophole — the client's own sample receipt lists a
300L heat pump at 199,940 and charges 180,940, because they negotiated. A form
that could not express that would have been a form nobody used, and the pad
would have stayed on the counter.

### "TAX INVOICE" — confirmed, but not yet compliant

The invoice was first built reading "SALES INVOICE", because a tax invoice is a
defined document under the VAT Act with ETR obligations attached and that was
not something to assume on the client's behalf. The client confirmed on
2026-08-07 that Oriel Power Ltd **is** ETR-registered, so it now reads "TAX
INVOICE".

That title brings obligations the wording alone does not satisfy:

- **The supplier's PIN is now printed in the header**, from `ORIEL_KRA_PIN`. It
  is an environment variable rather than a constant because the figure is the
  client's to supply, and a plausible-looking invented PIN would be far worse
  than a missing one. Unset, the line does not render at all — no token, no
  half-filled field, nothing a customer could mistake for a real PIN.
- **The buyer's PIN is printed** on the RECEIVED FROM line when one was
  captured. It is what lets a business customer reclaim the input VAT.
- **The Control Unit number and KRA QR code are NOT implemented.** A compliant
  ETR/eTIMS invoice carries a CU serial, a CU invoice number and a verification
  QR code, all of which come from the client's signing device or the OSCU/VSCU
  API. None of that can be guessed, and inventing the fields would produce a
  document that looks compliant and is not. Logged in "Proposed additions" and
  in PLACEHOLDERS.md as `{{ETIMS_CU_DETAILS}}`.

**Until `ORIEL_KRA_PIN` is set and eTIMS is wired, these are correctly-formatted
invoices titled "TAX INVOICE" that KRA would not accept as such.** That is a
deliberate, logged state, not an oversight.

### pdf-lib and the standard fourteen fonts, not HTML-to-PDF

The receipt is a fixed form: every box, rule and tick has a position on the
paper, and stating those positions directly is shorter and more faithful than
talking a layout engine into them. Headless Chrome is ~300MB and does not fit a
serverless function. Embedding the brand's web fonts would mean shipping font
binaries and hoping the file tracer packs them; Helvetica is inside every PDF
reader ever written, the client's own sample was set in system fonts anyway,
and the identity is carried by the logo, the navy/gold bands and the layout.
Generation takes milliseconds, which matters because a receipt is produced
inside the request that takes the customer's money.

Page geometry was measured from the two PDFs the client supplied: A4 width by
exactly half A4 height, so an ORIGINAL and its DUPLICATE stack on one sheet
with a tear line between them.

### Numbers are allocated at issue, and voiding never frees one

A draft has no number. Issuing allocates one from a per-type sequence and is a
no-op if pressed twice, so a slow connection cannot burn a second number for
the same sale. Voiding keeps the row and the number and stamps VOID across the
face of the PDF. A numbered series with an unexplained hole in it is what causes
trouble later; gaps are limited to genuinely abandoned drafts, which is why
numbering happens at issue rather than at creation.

### Nothing in the notification path may throw

Every email entry point is wrapped and none propagates a failure. Each is called
from inside a request that has already done the thing that mattered — taken an
order, banked a payment, moved a status. A customer who does not get their
receipt can be sent it again from the back office; an order lost because Resend
timed out cannot be recovered at all. Every attempt, including failures and the
ones skipped for want of an API key, is written to `email_log`.

Receipt emails are guarded at the document level rather than the email level.
Daraja retries its callbacks, and while the payment itself was already
idempotent, a customer receiving three receipts for one purchase reasonably
assumes they have been charged three times.

### The customer notification lives in `updateOrderStatus`, not in the routes

Both the admin's status buttons and `markDelivered()` in the M-Pesa flow reach
that one function. Wiring the email at each call site instead would eventually
produce a customer who hears about "processing" but not "delivered" because one
route forgot — the kind of gap that only shows up in front of a real buyer.

### Statuses with no customer-facing copy send nothing

`pending_payment` and `pending_cod` are covered by the order confirmation, and
`paid` is covered by the payment receipt, which carries the PDF and is a better
message than a bare status change. Silence beats a meaningless email.

### WhatsApp carries a link, not the file

No messaging deep link can carry an attachment. `wa.me` opens with the message
and a tokenised link to the document; for the file itself the clerk downloads
the original and attaches it in WhatsApp, which is two taps. Roughly half this
shop's buyers have no email address, so this is a delivery mechanism rather
than a fallback and is offered beside email, not beneath it.

### `water-treatment` ticks no box

The pad has eight printed tick boxes and water treatment is not among them.
Adding a ninth would be inventing a change to the client's own stationery, so
those products tick nothing and appear by name on their description line —
which is what the paper does too.

## Proposed additions

**Catalogue picker in the document writer.** Line descriptions are free text.
Pulling the product name, model code and current retail price straight from the
catalogue would be faster and would stop typos reaching a customer's receipt.
Not built because it was not asked for, and counter sales include plenty of
items that are not in the catalogue at all (PVC bends, valves, labour).

**Africa's Talking SMS.** The SMS copy is written and GSM-7 safe, and now
covers status changes as well as orders and payments, but there is still no
transport — messages are logged to a git-ignored file. Wiring it is a small job
once the client has credentials.

**eTIMS / ETR integration.** The client confirmed they are ETR-registered and
the invoice is titled accordingly, but the Control Unit serial, CU invoice
number and KRA verification QR code are not on the document. Doing it properly
means talking to their signing device or to KRA's OSCU/VSCU API and storing the
returned CU number against each document — a real piece of work, and one that
needs their device details. Until then the invoices are not compliant tax
invoices, which is recorded in PLACEHOLDERS.md.

**Statement of account.** Nothing summarises everything a customer owes across
several invoices. Worth having once there are enough credit customers to make it
useful.

**Cookie consent for Google Analytics.** GA4 sets first-party cookies. Kenya's
Data Protection Act 2019 requires informed consent for non-essential
processing, and the privacy policy is already awaiting advocate review
(`{{LEGAL_REVIEW_DATE}}`). No banner has been built — it is outside the brief
and would be the client's decision on wording and behaviour. Raise it with the
advocate at the same review. Until then GA4 stays inert wherever the
measurement ID is unset.

**`priceValidUntil` in product offers.** Google recommends it and its absence
is a non-blocking warning in Search Console. It is deliberately omitted rather
than guessed: how long a quoted price holds is a commercial fact only the
client can state. Logged as `{{PRICE_VALIDITY_DAYS}}`.

**`hasMerchantReturnPolicy` and `shippingDetails` in product offers.** Both
are strong signals for shopping results and both depend on facts still
unknown — they would be built from `{{RETURNS_WINDOW}}` and the delivery
terms. Worth adding as soon as those are confirmed.

## Store assistant and chat inbox (2026-10-22)

### Transcripts live in Supabase Storage, not a new table
The storefront database is changed through numbered SQL migrations applied by
hand in the Supabase SQL editor; the assistant needed transcripts before the
next migration window. One JSON document per conversation in a private
`chat-transcripts` bucket uses infrastructure that is already provisioned and a
document-shaped record that reads naturally. The trade-off is a read-modify-write
on every append: two writers landing in the same few milliseconds can lose one
message. At this shop's volume that is acceptable; if chat becomes busy, the
upgrade is a `chat_conversations` / `chat_messages` pair of tables with a
transactional insert, and the store module is the only file that changes.

### Polling, not websockets
The visitor widget polls every four seconds while open; the staff thread polls
every four seconds while visible; the list refreshes every fifteen seconds. A
socket would be tidier, but it needs a stateful service on Vercel and the back
office already runs on serverless functions. Polls stop when the tab is hidden,
so an idle admin screen costs nothing.

### A person cannot type into a chat they have not taken over
Replying is refused with a 409 unless the conversation status is `human`. This
is the one rule that keeps Baraka and a staff member from answering the same
message: taking over stops the assistant, handing back restarts it, and both
write a system note into the transcript so the visitor's copy has a visible
record of what happened.

### Unread means "a visitor said something since staff last looked"
The badge counts conversations with `unreadForStaff > 0`, not messages. Opening
the thread clears it. The assistant's own answers do not mark a chat unread for
staff — only a visitor message does — so the inbox is a list of people waiting,
not a log of bot activity.

### Custom type scale registered with tailwind-merge
`tailwind-merge` only knows Tailwind's stock font sizes, so it classified
`text-small` and `text-body` as colours. Merging a variant's `text-oriel-white`
with a size token silently dropped the colour; a green button on a light card
rendered navy lettering. `cn()` now extends the merger with the project's scale
(`display` through `eyebrow`), keeping size and colour in separate groups.

### The storefront widget is not mounted in the back office
`ChatWidget` returns null under `/admin`. Staff have the Chats screen and a
five-slot bottom bar; a floating shopfront launcher there covered the More
button and offered visitors' chrome to staff.

### Baraka never presents as AI; people reply on WhatsApp
The storefront names the assistant Baraka and carries no "AI" label: launcher,
header, footer and prompt all avoid the word. The only human path offered to a
visitor is WhatsApp; the back-office takeover still exists for staff, but the
shopfront never advertises an in-widget queue.

