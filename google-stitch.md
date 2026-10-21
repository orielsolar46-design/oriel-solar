# Oriel Solar — Back Office · Google Stitch brief

Every screen of the Oriel Solar admin, written to be pasted into Google Stitch
**one block at a time**. Thirty-two screens, each one self-contained.

## How to use this file

1. Paste **§1 Design system** into Stitch first, as its own prompt. It sets the
   palette and the rules everything else leans on.
2. Then paste **one screen block at a time** — from `### Screen 1` down to the
   next `###`. Each block repeats the colours it needs, so a screen still comes
   out right if Stitch loses the earlier context.
3. Screens 1–4 are the shell. Do those before anything else: every other screen
   sits inside the frame they establish.

Everything here is what the software already does. No feature is invented, and
the copy in quotes is the copy the app actually shows — so what Stitch draws can
be built without renegotiating the behaviour.

---

## §1 Design system — paste this first

Design a back-office dashboard for **Oriel Solar**, a solar equipment retailer
in Nairobi, Kenya. Staff use it to run orders, take payment at a customer's
gate, price stock and manage a 359-product catalogue.

The feel is **high-end operational software** — Linear, Stripe Dashboard, Vercel.
Calm, dense where it needs to be, generous with white space. Not a consumer app,
not a template. Confidence through restraint: one accent per view, never three.

### Colour

Exactly these values. No others — not for charts, not for illustrations.

| Token | Hex | Used for |
| --- | --- | --- |
| Navy | `#0B2A6B` | Structure, headings, active nav, primary buttons |
| Navy deep | `#061A46` | Sign-in background only |
| Navy ink | `#0A1733` | Body text, all figures |
| Orange | `#F26A21` | Call-to-action, anything wanting a human |
| Orange deep | `#D9541A` | Orange hover / pressed |
| Orange soft | `#FDEEE6` | Orange badge and icon-disc backgrounds |
| Gold | `#FDB913` | In-flight states only (waiting, pending) |
| Gold soft | `#FFF6E0` | Warning panel backgrounds |
| Green | `#3FA535` | Good news: paid, in stock, margin |
| Green deep | `#2E7D28` | Green text on soft green |
| Green soft | `#EAF6E8` | Green badge and success-panel backgrounds |
| White | `#FFFFFF` | All cards, the sidebar |
| Mist | `#F4F6FB` | The page behind the cards |
| Line | `#DCE3F0` | Every border, every divider |
| Slate | `#5A6784` | Secondary text, labels, inactive icons |

**The colour rules that make it look expensive:**

- Three colours carry meaning and only three. **Navy** = structure and "you are
  here". **Green** = good news. **Orange** = needs a human. Gold is reserved for
  things still in flight. Nothing is decorative.
- Never red. Failure states use orange on `#FDEEE6`.
- One saturated element per card, maximum. A navy pill *or* a green badge, not
  both.
- Cards are white on mist with a 1px `#DCE3F0` border and an almost-invisible
  shadow. The border does the work; the shadow is a whisper.

### Type

- One sans-serif family throughout — geometric, slightly condensed, Archivo or
  Inter.
- **Every number is monospaced.** Prices, counts, order numbers, dates, receipt
  codes, percentages. This is non-negotiable: it is how a column of figures
  lines up digit for digit when someone is scanning, and it is most of why the
  interface reads as a serious tool.
- Page title 28px semibold navy. Card title 17px semibold navy. Body 15px.
  Secondary 13px slate. Micro-labels 12px uppercase, letter-spacing 0.12em,
  slate.
- Currency is Kenyan shillings, always written `KES 126,000` — no decimals.

### Shape and depth

- Radius: 6px inputs, 12px cards, fully-round pills.
- Resting shadow `0 1px 2px rgba(10,23,51,0.06)`. Hover lift
  `0 12px 32px rgba(10,23,51,0.12)` with a 2px upward translate, 200ms ease-out.
- Card padding 20px. Gap between cards 16px. Page gutter 40px desktop, 16px
  mobile.

### Non-negotiable behaviour

- **Mobile-first is literal.** This dashboard is used one-handed, standing at a
  customer's gate, on a phone, on a weak mobile signal. Primary buttons on
  payment screens are 56px tall. Nothing important sits at the top of a phone
  screen where a thumb cannot reach.
- Desktop sidebar is 256px, fixed, white, with a 1px right border.
- Every table scrolls inside its own card. The page never scrolls sideways.

---

### Screen 1 — Sign in

Full-bleed deep navy `#061A46` page, centred white card 416px wide, radius 12px,
generous shadow. This is the only dark screen in the product — it marks the
boundary between the public shop and staff tooling.

Above the card, a brand lockup: a 6px-wide vertical bar with a top-to-bottom
gradient from gold `#FDB913` to orange `#F26A21`, then two stacked lines —
"Oriel Solar" in white 18px semibold, and "BACK OFFICE" beneath in 11px
uppercase, letter-spacing 0.12em, white at 50% opacity.

Inside the card:
- Heading "Staff sign in", 20px semibold navy `#0B2A6B`.
- Sub-line "Enter the staff passphrase to reach the dashboard." 15px slate.
- One label "Staff passphrase" and a password input, 44px tall, 1px `#DCE3F0`
  border, radius 6px. Focus turns the border navy.
- Full-width primary button "Sign in" — orange `#F26A21`, white text, semibold.

Beneath the card, centred: "Return to orielpower.com" in 13px white at 45%.

**Actions:** the button posts the passphrase and, on success, goes to the
dashboard. While in flight the label becomes "Signing in…" and the button is
disabled.

---

### Screen 2 — Sign in, rejected

Same as Screen 1, with a message panel between the input and the button:
background gold-soft `#FFF6E0`, radius 6px, 12px padding, 15px navy-ink text,
reading "That passphrase is not right."

Draw a second variant of the same card where, instead of the input and button,
there is a single panel reading "Staff access is not configured on this
deployment. Set ADMIN_STAFF_KEY in the environment to enable it." — with
`ADMIN_STAFF_KEY` in monospace. Same gold-soft panel.

---

### Screen 3 — Desktop shell, navigation rail

A 256px fixed left sidebar, white, 1px right border `#DCE3F0`, against a mist
`#F4F6FB` page.

**Top:** a 36px circular brand mark, then "Oriel Solar" 15px semibold navy over
"BACK OFFICE" in 11px uppercase letter-spaced slate. A 1px divider beneath.

**Nav list**, 8px horizontal padding, items 44px tall, fully-rounded pills,
15px medium, icon 18px on the left, chevron-right on the far right:

1. Dashboard (grid icon)
2. Orders (delivery lorry icon)
3. Products (box icon)
4. Stock (stacked-boxes icon)
5. Quotes (document icon)
6. Payments (receipt icon)
7. Inbox (envelope icon)

**Active item:** filled navy `#0B2A6B` pill, white text and icon, chevron at 90%
opacity. **Inactive:** slate text, no background; on hover a mist fill, navy
text, chevron fading up to 40%.

**Bottom,** above a 1px divider: "View the storefront" with a shop icon, and
"Sign out" with a log-out icon. Sign-out hovers to orange-soft `#FDEEE6` with
orange-deep text — the only warm thing in the rail.

**Top bar** across the content column: sticky, white at 95% with a backdrop
blur, 1px bottom border, 56px tall. It holds a pill-shaped search field —
mist fill, magnifier icon inset left, placeholder "Search products" — and, far
right, a pill-outlined "Sign out" button.

---

### Screen 4 — Mobile shell

Phone width, 390px.

**Top bar:** 32px circular brand mark, "Back office" 15px semibold navy, then
the search field shrinking to fit, then a compact sign-out button showing only
its icon.

**Bottom bar:** fixed to the bottom edge, white, 1px top border, seven equal
columns — the same seven destinations. Each is a 20px icon above a 10px label.
The active one is navy with a 2px orange `#F26A21` bar across the top of its
column; the rest are slate.

This bar is thumb-reachable by design. Content above it always has 96px of
bottom padding so the last row of a list is never trapped underneath.

---

### Screen 5 — Dashboard, full page

The landing screen. Title "Overview", 28px semibold navy, sub-line "Orders,
payments and stock at a glance." in 15px slate.

Stacked down the page with 24px gaps:

1. **Three action tiles** — what needs doing today, before any reporting figure.
2. **Four KPI cards.**
3. **One wide analytics card** with three figures and an area chart.
4. **Two cards side by side** — low stock, catalogue health.
5. **One wide card** — top products.

Everything is white on mist. Detail for each band follows in Screens 6–10.

---

### Screen 6 — Dashboard, action tiles

Three cards in a row (stacking to one column on a phone). Each is white, radius
12px, 1px `#DCE3F0` border, 16px padding, laid out as: a 44px circular tinted
disc with an icon, then two stacked lines of text, then a large monospaced
figure hard right.

| Tile | Disc | Title / hint | Figure |
| --- | --- | --- | --- |
| Delivery lorry | orange-soft `#FDEEE6`, orange-deep icon | "Out for delivery" / "Tap to take payment at handover" | count |
| Box | navy at 10%, navy icon | "Awaiting payment" / "Pay-now orders not completed" | count |
| Wallet | gold-soft `#FFF6E0`, navy-ink icon | "Pay-on-delivery owed" / "Across 4 orders not yet paid" | KES total |

Figures are 24px monospaced medium, navy-ink.

**Actions:** the first two tiles are links into the filtered order list and lift
2px with a navy border on hover. The third is a figure only — not a link.

---

### Screen 7 — Dashboard, KPI cards

Four cards, two columns on mobile, four across on desktop. Each is white, radius
12px, 1px border, 20px padding.

Layout inside: a top row with the label (15px semibold navy) over a sub-line
(13px slate), and a 36px circular tinted disc holding a 17px icon on the right.
Then, 16px below, a 26px monospaced figure — and on the same baseline, hard
right, an optional trend pill.

| Label | Sub-line | Disc | Figure colour |
| --- | --- | --- | --- |
| Revenue | "Paid orders, 30 days" | green-soft, wallet | green-deep `#2E7D28` |
| Orders | "Last 30 days" | navy 10%, bag | navy-ink |
| Today | "Orders placed today" | mist, calendar | navy-ink |
| This week | "Last 7 days" | mist, calendar | navy-ink |

**Trend pill:** fully round, 11px monospaced. Rising is green-soft background,
green-deep text, upward trend arrow. Falling is orange-soft background,
orange-deep text, downward arrow. Example content `+12%`.

Draw the row twice: once with trend pills on the first two cards, once with none
at all. Both are real — the pill is suppressed whenever there is no comparable
earlier week, because a percentage against zero cannot be defended.

**Action:** the Orders card is a link to the order list; it lifts on hover.

---

### Screen 8 — Dashboard, orders analytics

One wide white card, 20px padding.

**Header row:** "Orders, last 14 days" 17px semibold navy, with "Every order,
whatever its payment state" beneath in 13px slate. Hard right, a pill-outlined
button "All orders" — 1px `#DCE3F0` border, 13px semibold navy, hovering to an
orange border and orange text.

**Figure strip:** three columns separated by 1px vertical rules, with a 1px
horizontal rule above and below, 16px vertical padding.

- "Revenue, 30 days" → 20px monospaced green-deep
- "Orders, 30 days" → 20px monospaced navy-ink
- "Average order" → 20px monospaced navy-ink

Labels are 13px slate above each figure.

**Chart**, ~200px tall, full card width:

- A smooth area curve, gently undulating, no sharp corners.
- Stroke green `#3FA535`, 2px, round caps.
- Fill beneath the stroke is a vertical gradient from green at 28% opacity down
  to fully transparent at the baseline.
- Three horizontal guides: top and middle dashed `#DCE3F0`, the baseline solid.
- A small white circle with a 2px green ring at each of the 14 data points.
- Beneath, a row of 14 date labels — "22 Jul", "23 Jul" — 10px monospaced slate,
  spread edge to edge. On a phone show every other one.

The curve must never dip below the baseline.

---

### Screen 9 — Dashboard, low stock and catalogue health

Two equal white cards side by side, stacking on mobile.

**Left — "Low stock"**, hint "Counted items running down". A list divided by 1px
rules, each row a truncated product name in 15px navy-ink on the left and a
monospaced orange-deep quantity hard right. Footer link "Manage stock" in 15px
semibold navy with a right arrow, hovering to orange.

**Right — "Catalogue health"**, hint "What is holding products back". Three rows,
each with a 16px slate icon, a label, and a monospaced count hard right:

- warning triangle — "Prices needing review"
- crossed-out image — "Published without imagery"
- crossed-out eye — "Unpublished items"

Whole rows are links and turn orange on hover. Footer link "Manage products".

Also draw the left card's empty state: a dashed-border panel on mist at 60%,
centred, "Nothing running low" in 15px medium navy over "Counted items are all
above their threshold." in 13px slate.

---

### Screen 10 — Dashboard, top products

One wide white card. Title "Top products by order value", hint "Across all paid
orders".

Five rows divided by 1px rules. Each row: a 24px circular mist badge with a
monospaced rank number, the product name truncating in 15px navy-ink, then hard
right a monospaced "×3" quantity in slate and a monospaced KES total in
navy-ink, right-aligned in a fixed 112px column so the figures stack.

---

### Screen 11 — Dashboard, first run

The same page with nothing in it yet. Action tiles read `0`, KPI figures read
`0` and `KES 0`, average order shows an em-dash `—`, and no trend pills appear.

The chart still draws: guides, baseline, and a flat curve resting on the
baseline. Both list cards show their dashed empty-state panels. The top products
card is absent entirely.

This state must still look composed rather than broken — it is the first thing
the client will ever see.

---

### Screen 12 — Orders list

Title "Orders", sub-line "24 orders".

**Filter chips**, a horizontally scrolling row of fully-round chips, 15px medium,
each with a monospaced count after the label: "All", "Out for delivery", "Pay on
delivery", "Awaiting payment", "Paid", "Delivered". The active chip is filled
navy with white text and the count at 70% white; the rest are white with a 1px
`#DCE3F0` border and navy-ink text, hovering to a navy border.

**The list.** Each order is a full-width white card, radius 12px, 1px border,
16px padding, 8px apart, containing:

- Order number, monospaced 15px medium navy — e.g. `ORP-2026-0184`
- Beneath: customer name and county, 15px navy-ink, truncating
- Beneath that, a row of status pills
- Hard right: KES total, monospaced 15px medium, over a monospaced 11px slate
  date
- A chevron-right in slate at the far right edge

**Status pill colours:** Delivered and Paid are green-soft with green-deep text.
Payment failed, Cancelled and Refunded are mist with slate text. Everything
still in flight — Processing, Out for delivery, Pay on delivery, Awaiting
payment — is gold-soft with navy-ink text. Pills are 11px monospaced uppercase.

An unpaid pay-on-delivery order carries a second pill, orange-soft with
orange-deep text: "Payment due at handover".

**Action:** the whole card is a link to the order; it lifts 2px with an orange
border on hover.

---

### Screen 13 — Orders list, nothing to show

The same header and chips, with a dashed-border panel on mist at 60% in place of
the list, centred: "No orders in this view" in 15px medium navy, and "Try
another filter, or clear it to see everything." in 13px slate beneath.

---

### Screen 14 — Order detail, header and customer

**Back link** at the top: a left chevron and "All orders", 15px medium slate,
turning navy on hover.

**Title block:** the order number as the page title — monospaced, 36px, medium,
navy. Beneath it one 15px slate line combining status, payment method and
timestamp: "Out for delivery · Pay on delivery (M-Pesa) · 3 Aug 2026, 14:22".

**Customer card**, white, radius 12px, 16px padding, heading "Customer". A
definition list where each row has a slate label on the left and a navy-ink
value hard right:

- Name
- Phone — rendered as a monospaced navy underlined telephone link
- Email (only when given)
- "Deliver to" with town and county — or the label becomes "Collection" with the
  value "Collecting from premises"
- Notes (only when given)
- Business — company name and KRA PIN (only for business orders)
- Installation — the value "Requested" in semibold green-deep (only when asked
  for)

---

### Screen 15 — Order detail, items

White card, heading "Items". Rows divided by 1px rules. Each row has the product
name in 15px navy-ink with an 11px monospaced slate model code beneath, and hard
right a monospaced line total over an 11px monospaced slate breakdown "2 ×
KES 63,000".

Below a 1px rule: "Total" in 15px semibold navy on the left, and the order total
in 15px monospaced medium navy-ink on the right.

---

### Screen 16 — Order detail, moving the order on

White card, heading "Move this order on", holding a wrapping row of buttons.

The buttons offered depend on where the order is:

| Current state | Buttons |
| --- | --- |
| Awaiting payment | Cancel order |
| Paid | Start picking · Cancel order |
| Payment failed | Cancel order |
| Pay on delivery | Start picking · Cancel order |
| Processing | Mark out for delivery |
| Out for delivery | Mark delivered |

Forward steps are outline buttons — 1px navy border, navy text, white fill.
"Cancel order" is the destructive variant: orange fill, white text. When the
order is finished or cancelled the card shows no buttons at all.

Draw two extra states:
- An error message beneath the buttons in a gold-soft panel: "That change was
  not allowed."
- A gold-soft panel reading "This order cannot be marked delivered until the
  M-Pesa payment has been taken above." — shown on an unpaid pay-on-delivery
  order that is already out for delivery.

---

### Screen 17 — Order detail, payments and timeline

**"Payment attempts"** card. Each attempt: the status word on the left — green-deep
semibold when paid, navy-ink otherwise — and a monospaced amount hard right.
Beneath, an 11px monospaced slate line of phone, timestamp and staff member.
Then, when present, "Receipt QGH7X2M1PL" in monospaced navy-ink, a slate note
explaining any amount change, and the M-Pesa failure description.

**"Timeline"** card. A vertical list where each entry has a 6px orange dot at the
left, the event description in 15px navy-ink, and an 11px monospaced slate line
of timestamp and actor beneath.

**Below both cards**, a plain link with an external-link icon: "View the
customer's order page", 15px medium slate, turning navy on hover.

---

### Screen 18 — Take payment, ready ★

**This is the most important screen in the product.** It is used one-handed, on a
phone, standing at a customer's gate, often in bright sun. Design it for that
before anything else.

White card, 1px border, 20px padding, at the very top of a pay-on-delivery
order.

- Heading row: the green M-Pesa wordmark, then "Take payment at handover" in
  17px semibold navy.
- "Amount" in 15px slate on the left; hard right the amount in 20px monospaced
  medium navy-ink, followed by a 36px square pencil button in slate that hovers
  to a mist fill.
- "To" in 15px slate on the left, the phone number in 15px monospaced navy-ink
  on the right.
- **Primary button, 56px tall, full width**, orange `#F26A21`, white, 18px
  semibold: "Request payment — KES 126,000".

The button height is not negotiable. Neither is the size of the figures.

---

### Screen 19 — Take payment, adjusting the amount

Screen 18 with the pencil toggled on, revealing a mist `#F4F6FB` panel, radius
6px, 12px padding, above the primary button.

At the top of the panel, 13px slate: "The amount can only be reduced, and the
reason is recorded against the order."

Then three stacked 48px inputs with 1px `#DCE3F0` borders:
1. the amount, monospaced, numeric keypad
2. "Reason (required)"
3. "Different M-Pesa number", monospaced

The primary button is disabled and dimmed until a reason of at least three
characters is given, and beneath it sits a centred 14px navy-ink line: "Enter a
reason for the reduced amount before sending."

The amount can never be raised above the order total.

---

### Screen 20 — Take payment, waiting

The card becomes gold-soft `#FFF6E0` with a **2px** gold `#FDB913` border, 20px
padding, everything centred.

- "Waiting for the customer" 17px semibold navy.
- "They should approve the M-Pesa request on 254712345678" 15px navy-ink.
- The amount, enormous — 56px monospaced medium navy-ink, tight leading.
- Beneath, 15px monospaced slate: "18s · checking every 3 seconds", where the
  seconds tick up live.

No buttons. The screen is waiting on the customer's handset, and offering an
action here would only invite a double charge.

---

### Screen 21 — Take payment, received ★

The card becomes green-soft `#EAF6E8` with a **2px** green `#3FA535` border.

- A bold check mark and "Payment received" in 17px semibold green-deep.
- The amount in 36px monospaced medium green-deep.
- A 11px uppercase letter-spaced green-deep label: "M-PESA RECEIPT — READ THIS
  BACK TO THE CUSTOMER".
- Below it a **full-width white tappable bar**, radius 6px, 16px horizontal and
  12px vertical padding, holding the receipt code in 20px monospaced medium
  navy-ink with wide letter-spacing, and a copy icon in slate hard right.
  Tapping copies it and the icon becomes a green check for 1.5 seconds.
- When the order is out for delivery and now paid, a **56px full-width green
  confirm button**: "Mark as delivered".

The receipt has to be legible enough to read aloud at arm's length. That is the
whole design constraint.

---

### Screen 22 — Take payment, failed

Plain white card, 1px `#DCE3F0` border.

- "Payment not completed" 17px semibold navy.
- The reason in 15px navy-ink — e.g. "The customer did not complete the
  payment." or an M-Pesa description such as "Request cancelled by user."
- A 56px full-width orange button with a refresh icon: "Try again", which
  returns to Screen 18.

Note the restraint: no red, no alarm iconography. A declined payment at a gate
is routine, and the screen should not embarrass anybody.

---

### Screen 23 — Products list

Title "Products", sub-line "128 of 359 items". Two buttons top right: "Add a
product" (orange fill, white text) and "Import prices" (white, 1px `#DCE3F0`
border, navy text).

**Cost notice**, directly beneath the header: a navy-deep `#061A46` bar, radius
12px, 16px padding, with a small gold padlock icon and text in white at 85%:
"Dealer cost and margin are shown here for staff only. They never appear on the
public site, in any page source, or in any API response."

**Search row:** a 44px search input "Search name, brand or model code", a
category dropdown defaulting to "All categories", and a "Search" button with a
1px navy border.

**Filter chips**, same styling as the orders list: "All", "Published",
"Unpublished", "Needs review", "No imagery", "Low stock".

Then the product rows — see Screen 24. Beneath a long list, a 15px slate line:
"Showing the first 100. Narrow the search to see more."

---

### Screen 24 — Product row anatomy

One white card, radius 12px, 1px border, 16px padding, hovering to a navy border.

**Left column:**
- Brand in 12px uppercase letter-spaced slate
- Product name in 15px semibold navy
- Model code and category in 11px monospaced slate, e.g. `SPF-6000-ES-PLUS ·
  inverters`
- A wrapping row of status pills, 11px monospaced uppercase:
  - "Unpublished" — mist, slate
  - "Needs review" with a warning triangle — gold-soft, navy-ink
  - "No imagery" with a crossed-out image icon — mist, slate
  - "Out of stock" with a crossed-box icon — solid navy, white
  - "12 in stock" — mist, slate

**Right column, right-aligned:**
- A padlock icon and "cost KES 98,000" in 12px monospaced slate
- The retail price in 15px monospaced medium navy-ink — or the words "no price"
- Margin in 12px monospaced: green-deep at 20% or better, navy-ink below that,
  e.g. `+28% · KES 28,000`
- **Row action buttons** beneath, small, 1px-bordered, 13px semibold:
  - "Out of stock" (crossed-box icon) — hovers gold-soft; becomes "Back in
    stock" with a check when the item is already out
  - "Remove" (crossed-eye icon) — asks for confirmation first: "Take this off
    the shop? It stays in your records and can be put back."; becomes "Put back"
    with a rotate icon when the item is unpublished
  - While an action is in flight the button shows a spinner

If the product carries a pricing note, it sits full-width beneath in a gold-soft
panel, 13px navy-ink.

---

### Screen 25 — Add a product, photographs

Page title "Add a product". First card, white, heading "Photographs" 17px
semibold navy, with "Up to three, chosen together. JPEG, PNG or WebP, under 5MB
each." in 15px slate.

A row of 96px squares:
- Uploaded images sit in a 6px-radius mist tile with a 1px border, the picture
  contained not cropped, and a 24px circular navy-at-85% button top-right with a
  white ✕ to remove it.
- The next slot is a dashed-border tile, centred, holding an "image plus" icon
  above the word "Add" in 13px slate. Hovering turns border and text navy.
- While uploading it shows a spinner and the word "Uploading", dimmed and
  non-interactive.

Photographs come first because a photograph is what the person has in their
hand. Uploads start the moment files are chosen, so the slow part overlaps with
the typing.

---

### Screen 26 — Add a product, details

Two more white cards.

**"What it is"**
- "Product name" — required, placeholder "Livoltek 5kW Hybrid Inverter"
- Two columns: "Where it goes" (required category dropdown, "Choose a
  category…") and "Type within it" (dropdown, disabled with the text "Choose a
  category first" until a category is picked)
- Two columns: "Brand" (dropdown, "No brand") and "Model code" (placeholder
  "LV-5K-H")
- "One-line description" — required, hint "This is the sentence a customer reads
  on the listing."
- "Key specs" — hint "Separated by commas. Up to eight, three show on the card.",
  placeholder "5 kW, 48 V, Single phase"

**"Price and stock"** — a two-column grid:
- "Selling price (KES)" — required, hint "What the customer pays."
- "What it cost you (KES)" — hint "Staff only. Drives the margin column."
- "How many you have"
- "Warranty (years)"

Then a mist panel with a checkbox using an orange accent: "This needs
professional installation".

**Field styling:** label 15px medium navy-ink, and every optional field appends a
lighter slate "(optional)" — only required fields are unmarked, which is the
opposite of the usual asterisk and much easier to scan. Inputs are 44px, 1px
`#DCE3F0`, radius 6px; focus turns the border navy with a soft orange ring.
Hints sit beneath in 13px slate.

**Footer:** a 48px orange "Add to the shop" button showing a spinner and the word
"Saving" while in flight, and a plain underlined navy "Cancel" link.

---

### Screen 27 — Add a product, saved

The whole form is replaced by one white card, 24px padding.

- A green check icon and "Livoltek 5kW Hybrid Inverter is saved" in 17px
  semibold navy.
- Optionally a 15px navy-ink note beneath.
- Three buttons in a row: "View it on the shop" (orange fill), "Add another"
  (1px navy border), "Back to products" (1px `#DCE3F0` border).

---

### Screen 28 — Inventory

Title "Inventory", sub-line "Everything in the catalogue, and what it is worth."

**Three money cards** across the top — same KPI card shape as Screen 7 but with
no icon disc and no trend pill:
- "Stock at cost" / "What is on the shelf, at what you paid"
- "Stock at retail" / "What it sells for, if it all sells"
- "Margin in stock" / "Retail less cost — not yet earned" — figure in green-deep

**A caveat bar**: mist fill, 1px border, radius 12px, 13px slate — "Value counts
only the 214 of 359 products with a recorded quantity — 1,847 units in total.
Anything without a count contributes nothing rather than a guess."

**Four health cards**: "Live on the shop" (green figure, sub "of 359"), "Out of
stock" (orange figure when above zero, and a link), "Low stock" (gold figure, sub
"3 or fewer left"), "Not on the shop" (sub "Unpublished or unpriced").

**"By category" table** inside a card, scrolling horizontally within its own
border. Header row is mist with 12px uppercase letter-spaced slate labels:
Category, Items, Live, Out, Units, At retail. Body rows are 15px, every figure
monospaced and right-aligned, category names in medium navy. A non-zero "Out"
count is semibold orange-deep. Empty cells are an em-dash `—`, never `0`. Rows
tint to mist at 60% on hover.

**"Out of stock (12)"** card beneath, with a crossed-box icon in the heading and
a list of bordered rows, each holding a product name in medium navy and its
category in 13px monospaced slate.

---

### Screen 29 — Import prices, upload and mapping

Title "Import supplier prices".

**Step indicator:** three fully-round pills in a row — "1 Upload", "2 Map
columns", "3 Review changes", the number monospaced. The current step is filled
navy with white text; completed steps are green-soft with green-deep text;
future steps are white with slate text.

**Step 1** — a large dashed-border white panel, 32px padding, centred: a 28px
file-upload icon in slate, "Upload a supplier price list as CSV." in 15px
navy-ink, then in 13px slate "Export the supplier's spreadsheet as CSV first.
Nothing is changed until you approve the preview." Beneath, an orange button
"Choose a CSV file".

**Step 2** — a white card, heading "Which columns are which?" with "412 rows read
from the file." beneath. Two columns:
- Left: label "Column identifying the product", a dropdown of the file's own
  headers, and beneath it two small pill toggles — "Match on model code" and
  "Match on name" — the selected one orange-soft with navy text, the other mist
  with slate.
- Right: label "Column with the dealer cost" and a dropdown.

Beneath, a small bordered sample table with the header row on mist and four rows
of the user's actual data, so the mapping can be sanity-checked before anything
runs. Two buttons: a ghost "Back" and a primary "Preview changes" with a right
arrow.

---

### Screen 30 — Import prices, review and apply

**Four summary tiles** across the top, each a bordered card with a 11px uppercase
letter-spaced slate label and a 20px monospaced figure: "Price changed" (gold
border, gold-soft fill), "Unchanged", "New items", "Skipped" (all three plain
white).

**The diff table**, inside a bordered card, header row on mist: Product, Verdict,
Cost, Retail.

- Product shows the matched name with an explanatory slate note beneath where
  one applies.
- Verdict is a small round badge — "changed" gold-soft, "new" orange-soft,
  "unchanged" and "skipped" mist with slate.
- Cost and Retail on a changed row show **the old value struck through in slate,
  followed by the new value in navy-ink** — this side-by-side is the entire point
  of the screen.
- Unchanged rows show a single slate figure; empty cells are an em-dash.

**Footer:** a ghost "Back to mapping" button and a primary button reading "Apply
37 changes", which is disabled when nothing would change. A gold-soft result
panel appears above the buttons once applied.

Nothing is written until this screen is approved. Design it so that is obvious.

---

### Screen 31 — Quote requests

Title "Quote requests", sub-line "Quotation requests, survey bookings and
warranty registrations, newest first."

Each request is a white card, radius 12px, 16px padding, 8px apart:

- A type pill at the top with a small icon — "Quotation" (document icon,
  orange-soft), "Site survey" (ruler, gold-soft), "Warranty registration"
  (shield, green-soft).
- The person's name in 15px semibold navy.
- An 11px monospaced slate line joining phone, email, county and order number
  with middle dots.
- "About: livoltek-5kw-hybrid-inverter" in 11px monospaced navy-ink when the
  request names a product.
- The message in a mist panel, radius 6px, 12px padding, 15px navy-ink,
  preserving the customer's own line breaks.
- Hard right: an orange "Call" button with a phone icon, and a 10px monospaced
  slate timestamp beneath.

Empty state: "No requests yet" over "Requests from the quote form, survey booking
and warranty registration arrive here."

---

### Screen 32 — Payments ledger and Inbox

Two screens sharing one block; draw both.

**Payments** — title "Payments", sub-line "Every M-Pesa attempt, for
reconciliation against the M-Pesa statement." Top right, a small bordered white
card: "RECEIVED" in 12px uppercase slate above a monospaced green-deep total.

Filter chips with counts: "All", "Paid", "Failed", "Cancelled", "Awaiting".

Each attempt is a white card: the order number as a monospaced navy link
(hovering orange), the customer name in 15px navy-ink, an 11px monospaced slate
line of phone, timestamp and staff member, then "Receipt QGH7X2M1PL" in
monospaced navy-ink and any failure description in 13px slate. Hard right, a
status pill — paid green-soft, awaiting gold-soft, everything else mist — above a
15px monospaced amount.

**Inbox** — title "Inbox", sub-line "Call-back requests, newest first." Chips:
"Call-backs" with a count, and "Past sizing leads" with a count, which appears
only while historical leads remain.

A call-back card: a speech-bubble icon and the person's name in 15px semibold
navy, their stated need in 15px navy-ink, county in 13px slate. Hard right, an
orange "Call back" button with a phone icon, the phone number in 11px monospaced
slate beneath, and the timestamp in 10px monospaced slate.

A sizing-lead card: a calculator icon and the email in 15px semibold navy, then a
row of monospaced 13px figures — "5 kW array", "5 kW inverter", "10 kWh battery"
— then county and timestamp in 13px slate, then a link with an envelope icon:
"Email this customer", navy semibold with a 2px orange underline.

Empty states: "No call-back requests yet" over "Requests from the contact band
and contact page arrive here."

---

## §2 What to hold on to

If Stitch drifts, these are the things worth correcting it on. They are what
separates this from a template:

1. **Every number is monospaced.** It is most of the reason the thing reads as
   professional software.
2. **Three colours, three jobs.** Navy structure, green good, orange needs-you.
   The moment a fourth appears decoratively, it looks like a template again.
3. **Never red.** Failures are orange on `#FDEEE6`.
4. **The gate screens win every argument.** Screens 18–22 are used one-handed in
   sunlight with a customer waiting. 56px buttons, huge figures, no clutter.
5. **Empty cells are an em-dash, never a zero.** A zero is a claim; a dash is an
   absence. The same rule kills invented percentages.
6. **Cards carry a 1px border and barely any shadow.** Heavy shadows are the
   fastest way to make this look cheap.
7. **The mobile bottom bar is not a compromise.** It is where the product is
   actually used.
