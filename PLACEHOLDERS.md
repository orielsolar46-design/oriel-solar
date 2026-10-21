# Placeholders — client to confirm

Every `{{TOKEN}}` in the build is listed here with the question the client must
answer. Nothing on the site is invented; anything unconfirmed is a placeholder.

Status legend: 🔴 blocks launch · 🟠 needed before its stage · 🟢 nice to have

| Token | What it is | Who answers | Status |
|---|---|---|---|
| ~~`{{RETAIL_MARKUP_PERCENT}}`~~ | **RESOLVED 2026-08-01 — 20%.** Client: "On the Dealer price add a margin of 20%." Applied as dealer x 1.20, VAT-normalised, rounded up to KES 100. All 89 published products verified against the rule. | Client | ✅ |
| `{{BUSINESS_ADDRESS}}` | Physical Nairobi address for `LocalBusiness` schema and the contact map. | Client | 🔴 |
| `{{PICKUP_ADDRESS}}` | Collection point, if collection is offered. | Client | 🟠 |
| `{{DELIVERY_RATE_CARD}}` | Delivery cost per zone (Nairobi / Metro / Upcountry / Remote). | Client | 🟠 |
| `{{FREE_DELIVERY_THRESHOLD}}` | Order value that qualifies for free delivery (or "none"). | Client | 🟠 |
| `{{INSTALLATION_FEE_POLICY}}` | Flat fee, percentage, or survey-based. | Client | 🟠 |
| `{{MPESA_SHORTCODE}}` | Paybill or Till number, and which type. | Client | 🔴 (Stage 7) |
| `ORIEL_KRA_PIN` | **Oriel Power Ltd's own KRA PIN.** Client confirmed on 2026-08-07 that the company is ETR-registered, so invoices are titled **TAX INVOICE** — and a tax invoice under the VAT Act must identify the supplier by PIN. Set as an environment variable, not a `{{TOKEN}}`: until it is set the PIN line does not render at all, so nothing invented or half-filled can reach a customer. **Every invoice issued before this is set is not a compliant tax invoice.** | Client | 🔴 |
| `{{ETIMS_CU_DETAILS}}` | Control Unit serial, CU invoice number and the KRA verification QR code. Required on a compliant ETR/eTIMS tax invoice and **not built** — it needs the client's eTIMS device or the OSCU/VSCU API credentials, and cannot be guessed. See DECISIONS.md "Proposed additions". | Client | 🔴 |
| `{{SAVINGS_BAND_STATISTICS}}` | The four figures in the green home band: average monthly saving, average payback, tonnes CO₂ offset, litres of diesel displaced. Not invented — supplied or omitted. | Client | 🟠 |
| `{{PROJECT_PHOTOS_AND_DETAILS}}` | Real completed installations (photos + details). Section hidden until supplied. | Client | 🟠 |
| `{{TEAM_AND_CREDENTIALS}}` | EPRA licence number, certifications, years trading. | Client | 🟠 |
| `{{RETURNS_WINDOW}}` | Returns policy period and conditions. | Client | 🟠 |
| `{{WARRANTY_HANDLING}}` | Who honours warranty claims — Oriel or the manufacturer. | Client | 🟠 |
| `{{OPERATING_HOURS}}` | Business hours for contact page and `LocalBusiness` schema. | Client | 🟠 |
| `{{GA4_MEASUREMENT_ID}}` | Google Analytics 4 measurement ID, form `G-XXXXXXXXXX`. Create the property at analytics.google.com, then set it as `NEXT_PUBLIC_GA4_MEASUREMENT_ID` on Vercel. Until it is set no analytics tag is rendered at all — the site collects nothing. | Client | 🟠 |
| `{{PRICE_VALIDITY_DAYS}}` | How many days a published price is held for. Feeds `priceValidUntil` in the product schema, which Google asks for on every offer. Deliberately omitted rather than guessed — see DECISIONS.md. | Client | 🟢 |
| `{{SMS_PROVIDER_CONFIRM}}` | Confirm Africa's Talking vs an alternative SMS provider. | Client | 🟠 |
| `{{SOLUTION_STARTING_PRICES}}` | "From KES …" starting price per solution card (home backup, full solar home, business, farm, estate lighting). Hidden on the cards until confirmed — derivable from the catalogue once the markup and bundle compositions are agreed. | Client | 🟠 |
| `{{BRAND_LOGOS}}` | Official logo files for Jinko, Livoltek, Solis, Growatt, Deye, Victron, Lorentz, Hanti. The home brands row renders styled wordmarks until supplied. | Client / suppliers | 🟢 |
| `{{LEGAL_REVIEW_DATE}}` | Date the terms, privacy policy and delivery/returns pages were reviewed. **The three legal pages are complete working drafts and must be reviewed by a Kenyan advocate before launch** — they are not legal advice. | Client's advocate | 🔴 |
| `{{SUPABASE_DB_PASSWORD}}` | Needed to apply `supabase/migrations/0001_schema.sql` from the command line. Alternative: paste that file into the Supabase SQL Editor once — see the note below. | Client | 🔴 |

## Status of the visible tokens (2026-08-03)

The storefront no longer renders a single `{{TOKEN}}` to a customer. That is
**not** the same as the facts being known. Only one was actually answered; for
the rest the copy was rewritten to say something true without the fact, or the
block was removed. Each is listed below with what the page says now.

| Token | Where it was | What the site says now |
|---|---|---|
| `{{LEGAL_REVIEW_DATE}}` | 3 legal pages | **Answered** — 3 August 2026, client confirmed their advocate reviewed the pages |
| `{{OPERATING_HOURS}}` | footer band, all 23 pages + contact | Hours claim dropped: "Call us or send a WhatsApp message and an engineer will come back to you." Contact page hours row removed |
| `{{BUSINESS_ADDRESS}}` | contact, terms, 2 schema blocks | "Nairobi, Kenya" only. `streetAddress` **omitted** from the Organization and LocalBusiness schema — an absent field is valid, a placeholder string is not |
| `{{WARRANTY_HANDLING}}` | terms, FAQ, warranty, PDP, returns | Rewritten as process, not liability: start every claim with us, contact with order number. Who ultimately bears the cost is still unstated |
| `{{RETURNS_WINDOW}}` | terms, returns, PDP | **Line removed.** A returns window is a binding commitment and is not invented. Conditions (unused, original packaging, not installed) still stated |
| `{{DELIVERY_RATE_CARD}}` | delivery-returns | "Quoted per order rather than from a fixed rate card" — which is how checkout already behaves (`deliveryFee` is null until confirmed) |
| `{{FREE_DELIVERY_THRESHOLD}}` | delivery-returns | Line removed — no threshold is implemented anywhere |
| `{{PICKUP_ADDRESS}}` | returns, checkout, order summary | "Collect from us in Nairobi — we confirm the point and time when your order is ready" |
| `{{INSTALLATION_FEE_POLICY}}` | services, checkout, buy box, PDP | "Quoted per job after a site survey, confirmed in writing before work is booked" — matches the survey/quote flow already built |
| `{{TEAM_AND_CREDENTIALS}}` | about | **Credentials section removed entirely.** An EPRA licence number cannot be implied, let alone invented |

**Still owed by the client**, in order of how much they cost:

1. **Returns window** — the only genuine legal gap. The returns section now
   describes conditions but states no period.
2. **EPRA licence number, certifications, years trading** — restores the
   Credentials section, and is the strongest trust signal an installer has.
3. **Premises address** — puts `streetAddress` back into the schema, which is
   what local search ("solar shop Nairobi") ranks on.
4. **Operating hours** — restores the hours row and the "answered ..." line.
5. **Collection address** — if collection is genuinely offered.
6. **Who honours warranty claims** — Oriel or the manufacturer.

## Imagery needed
Logged per-SKU during Stage 2 when fewer than two usable manufacturer images exist.

Rollout status (2026-07-30): **65 published SKUs carry official manufacturer or
distributor photography** (Livoltek/Hexing inverters, batteries, ESS and street
lights; Solis inverters; Jinko bifacial panels; Hanti heater). **168 published
SKUs render the sun-arc branded placeholder** (`public/products/placeholder.svg`)
until photography is supplied:

| Brand | SKUs | Why no official image yet |
|---|---|---|
| Solargen BOS + Hexing BOS | 52 | Generic hardware (breakers, clamps, cable) — no official product photography exists; ask suppliers for photos or shoot in-house |
| Hanti (pumps, RO, spares) | 25 | No manufacturer web presence — ask Solargen for their product photos |
| Lorentz | 19 | Official site is JS-rendered; images not retrievable — ask Solargen |
| Lithium Valley / Lekkerix | 20 | lithiumvalley.com blocks direct asset requests — ask Lekkerix for photos |
| Maqbul | 11 | No official web presence found — ask Solargen |
| Horay | 11 | No official web presence found — ask Lekkerix |
| Jinko (445W panel, inverters, battery) | 7 | 445W is an older series (Tiger Neo imagery would misrepresent); inverter/battery pages not retrievable |
| Solis (3P LV trio, HV 15/20K) | 5 | No family page on the official Kenyan site for these exact models |
| Victron | 5 | ~~Product pages are JS-rendered; images not retrievable~~ — wrong. victronenergy.com serves model-named photographs from the product page HTML at `/upload/documents/`, which is how the Chloride Victron lines were photographed on 2026-08-03. These five can be done the same way |
| Growatt | 3 | Site unreachable from the build machine |
| Others (TW, Shiyuan, Deye, Livoltek small parts) | 10 | Various — logged per SKU in `data/products.json` (empty `images` array) |

| SKU | Have | Need |
|---|---|---|
| `hanti-jfp-300` (Hanti JFP-300 solar water heater) | 1 official distributor image + datasheet PDF | A second angle or installation photograph |
| `hexing-hx-sl-*` (Hexing street lights) | 1 official render (HX-SL series) | A second angle or an installed-in-Kenya photograph |
| `livoltek-hyper-*` (Hyper ESS) | 1 official render (badge cropped) | A second angle |
| `livoltek-psd300-r310` (Wi-Fi module) | 1 official render | A second angle |

## Pricing questions raised by extraction (client/supplier to answer)

| Question | Detail |
|---|---|
| Lekkerix VAT status | The 202606 quotation does not state whether prices include VAT. All 37 Lekkerix-sourced SKUs are `needs_review` until confirmed. |
| Livoltek list validity | The Hexing/Livoltek list is printed "Valid for Q2 of 2025" — confirm prices still hold before launch. |
| Victron & Lorentz "Offer Price" | Solargen lists these with a single price column — confirm whether it is dealer cost or retail. Flagged `needs_review`. |
| Livoltek WL 6kW / 125kW trio | Three lines share one price (KES 345,000) and duplicate other models' codes — looks like a paste error on the source list. Loaded unpublished. |
| Livoltek GT3-125K | Listed as "12kW" against a 125K model code — rating contradiction. Loaded unpublished. |
| Hyper 6000 rating | Described as "5 KW" on the source list — confirm actual rating. |
| Hexing AC combiner box | Same model code listed at KES 7,000 and KES 3,500 — the 7,000 line was used. |
| **20% — markup or margin?** | Applied as dealer x 1.20 (add 20% to the dealer price), the plain reading of the client's wording. If they meant a 20% *gross margin* in the accounting sense, the divisor is 0.80 and every price rises about 4% (dealer x 1.25). One word from the client settles it; re-run `scripts/apply-pricing.mjs` after changing `RETAIL_MARKUP_PERCENT`. |
| **Supplier retail now overridden** | Solargen prints its own Retail column, roughly dealer + 45%. The client's 20% rule takes precedence, so Oriel now lists below Solargen's suggested retail on those lines. Deliberate, but worth the client knowing. |
| **SRNE price basis** | The "UPDATED SRNE PRICES" figures are treated as **dealer cost**, with retail derived by the standard markup. If they are in fact retail prices, all 14 SRNE products are currently over-priced. Confirm before launch. |
| Livoltek L1 vs L2 column | The Livoltek list prints a "Distributor" (L1) and a "Dealer" (L2) column. The 20% rule is applied to whichever figure was loaded as cost — confirm Oriel pays the column we used, or every Livoltek price is wrong by the gap between the two. |

## SRNE price-list lines not yet loaded

Six lines from the SRNE price message could not be matched to a specific model
on SRNE's catalogue, so they were left out rather than guessed at. Each needs a
model code from the supplier.

| Line as supplied | Price (KES) | What is needed |
|---|---|---|
| 1.5kW inverter | 26,000 | SRNE list several 1.5kW units — which model? |
| 3kW, 108Vdc | 36,000 | 108Vdc is unusual for SRNE — confirm the model code |
| 3.3kW, 500Vdc | 39,000 | Confirm whether HESP or AFP series |
| 6kW "Hyp" | 80,000 | No "HYP" series appears on SRNE's site — confirm the model |
| 24V 100Ah, 2.56kWh | 59,000 | Confirm model code |
| 12V 200Ah, 2.56kWh | 59,000 | Confirm model code |
