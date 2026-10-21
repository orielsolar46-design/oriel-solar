# Oriel Solar — Back Office, second pass · Google Stitch brief

Three things the back office cannot yet do, written to be pasted into Google
Stitch **one block at a time**.

1. **Quick edit** — change a product's price and photograph on a phone, one
   handed, and commit it.
2. **Set stock** — say how many of a thing are actually on the shelf.
3. **Send a payment prompt** — push an M-Pesa request to a pay-on-delivery
   customer by typing a number and an amount.

## How to use this file

1. Paste **§1 Design system** first, as its own prompt. It is the same system
   the first thirty-two screens were drawn against, restated so a fresh Stitch
   session comes out matching.
2. Then paste **one screen block at a time** — from `### Screen A1` to the next
   `###`. Each block repeats the colours it needs.
3. Screens A1–A4 are one flow and should be drawn in order.

Everything in quotes is the copy the screen should show. Every constraint
stated as a rule — reduce-only, three attempts, 5MB — is a real rule already
enforced by the server, not a suggestion. The **"Behind it"** note that closes
each block says what the screen talks to, so what Stitch draws can be built
without renegotiating the behaviour.

---

## §1 Design system — paste this first

Design a back-office dashboard for **Oriel Solar**, a solar equipment retailer
in Nairobi, Kenya. Staff use it to run orders, take payment at a customer's
gate, price stock and manage a 359-product catalogue.

The feel is **high-end operational software** — Linear, Stripe Dashboard,
Vercel. Calm, dense where it needs to be, generous with white space. Confidence
through restraint: one accent per view, never three.

### Colour — exactly these values, no others

| Token | Hex | Used for |
| --- | --- | --- |
| Navy | `#0B2A6B` | Structure, headings, active nav, primary buttons |
| Navy deep | `#061A46` | Staff-only notices |
| Navy ink | `#0A1733` | Body text, all figures |
| Orange | `#F26A21` | Call-to-action, anything wanting a human |
| Orange deep | `#D9541A` | Orange hover / pressed |
| Orange soft | `#FDEEE6` | Orange badge and icon-disc backgrounds |
| Gold | `#FDB913` | In-flight states only (waiting, pending) |
| Gold soft | `#FFF6E0` | Warning panel backgrounds |
| Green | `#3FA535` | Good news: paid, in stock, margin |
| Green deep | `#2E7D28` | Green text on soft green |
| Green soft | `#EAF6E8` | Green badge and success-panel backgrounds |
| White | `#FFFFFF` | All cards |
| Mist | `#F4F6FB` | The page behind the cards |
| Line | `#DCE3F0` | Every border, every divider |
| Slate | `#5A6784` | Secondary text, labels, inactive icons |

- Three colours carry meaning and only three. **Navy** = structure and "you are
  here". **Green** = good news. **Orange** = needs a human. Gold is reserved for
  things still in flight.
- **Never red.** Failure states use orange on `#FDEEE6`.
- One saturated element per card, maximum.
- Cards are white on mist with a 1px `#DCE3F0` border and an almost-invisible
  shadow. The border does the work; the shadow is a whisper.

### Type

- Headings in **Archivo**, body in **Public Sans**.
- **Every number is monospaced — IBM Plex Mono.** Prices, counts, order
  numbers, dates, receipt codes, percentages, quantities. Non-negotiable.
- Page title 28px semibold navy. Card title 17px semibold navy. Body 15px.
  Secondary 13px slate. Micro-labels 12px uppercase, letter-spacing 0.12em.
- Currency is Kenyan shillings, always `KES 126,000` — no decimals.

### Shape and behaviour

- Radius: 6px inputs and buttons, 12px cards, fully-round pills.
- Resting shadow `0 1px 2px rgba(10,23,51,0.06)`. Hover lift
  `0 12px 32px rgba(10,23,51,0.12)` with a 2px upward translate, 200ms.
- Card padding 20px. Gap between cards 16px.
- Status pills are `24px` tall, `12px` horizontal padding, 11px monospaced
  uppercase, letter-spacing 0.12em.
- **Mobile-first is literal.** Every screen in this file is used one-handed, on
  a phone, standing in a store room or at a customer's gate. Primary buttons are
  56px tall. Nothing that commits a change sits at the top of the screen where a
  thumb cannot reach.

---

### Screen A1 — Quick edit, the entry point

A phone screen, 390px wide, mist `#F4F6FB` background.

At the top, a back link: a left chevron and "All products", 15px medium slate,
turning navy on press.

**The product identity card** — white, 12px radius, 1px `#DCE3F0` border, 16px
padding. A 64px square photograph on the left in a 6px-radius mist tile, the
picture contained not cropped. To its right: the brand in 12px uppercase
letter-spaced slate, the product name in 17px semibold navy over two lines
maximum, and the model code in 11px monospaced slate.

**Two large tap targets** beneath, stacked, 16px apart. Each is a white card,
12px radius, 1px border, 20px padding, laid out as a 44px circular tinted disc,
then two stacked lines, then a chevron-right hard right:

| Tile | Disc | Title / current value |
| --- | --- | --- |
| Price tag icon | orange-soft `#FDEEE6`, orange-deep icon | "Change the price" / current retail in 20px monospaced navy-ink |
| Camera icon | navy at 10%, navy icon | "Change the photograph" / "3 photographs" in 15px slate |

Both tiles press to a mist fill and a navy border.

Beneath them, a staff-only notice: a navy-deep `#061A46` bar, 12px radius, 16px
padding, a small gold padlock icon and text in white at 85%, 14px: "Cost and
margin are staff-only. They never appear on the public site."

**Behind it:** reads the product the admin arrived from. Nothing is written on
this screen — it only chooses which of the two editors to open.

---

### Screen A2 — Quick edit, the price

The same phone frame. Page title "Change the price" 28px semibold navy, and
beneath it the product name in 15px slate, truncating to one line.

**The price card**, white, 20px padding:

- Label "What the customer pays" in 15px medium navy-ink.
- A **56px tall** input, 6px radius, 1px `#DCE3F0` border, holding the amount in
  **24px monospaced medium navy-ink**, prefixed by a non-editable "KES " in
  20px monospaced slate. Numeric keypad. Focus turns the border navy with a soft
  orange ring.
- Beneath, a row of three **suggestion chips**, fully round, 1px `#DCE3F0`
  border, white, 13px monospaced navy-ink: the current price, the price the
  markup implies from dealer cost, and that plus five per cent. The middle chip
  carries a 10px uppercase letter-spaced slate label above the row reading
  "SUGGESTED FROM COST". Tapping a chip fills the input.

**The margin strip**, directly beneath the input, inside the same card: a mist
`#F4F6FB` panel, 6px radius, 12px padding, three columns divided by 1px vertical
rules, each a 12px uppercase letter-spaced slate label over a 15px monospaced
figure — "COST" in navy-ink, "MARGIN" in green-deep `#2E7D28` when 20% or
better and navy-ink below that, "PERCENT" in the same colour as margin.

**This strip recalculates live as the number is typed.** That is the whole point
of the screen: the person setting a price can see what it earns before they
commit it.

If the typed price is **below cost**, the strip turns gold-soft `#FFF6E0` and a
13px navy-ink line appears: "That is below what you paid for it." The commit
button stays enabled — selling at a loss is sometimes deliberate — but the
warning does not go away.

**Behind it:** the suggested price comes from dealer cost multiplied by the
configured retail markup. Cost is never rendered anywhere a customer can reach.

---

### Screen A3 — Quick edit, the photograph

The same phone frame. Page title "Change the photograph", sub-line "Up to three.
JPEG, PNG or WebP, under 5MB each." in 15px slate.

**The current photographs**, a row of three 96px squares, 6px radius, 1px
border, mist fill, the picture contained not cropped:

- Each carries a 24px circular navy-at-85% button top-right with a white ✕.
- The first is labelled with a fully-round navy pill, 10px uppercase
  letter-spaced white, reading "MAIN" — it is the one the shop lists.
- An empty slot is a dashed-border tile holding an "image plus" icon above the
  word "Add" in 13px slate.
- A slot mid-upload shows a spinner over the word "Uploading", dimmed and
  non-interactive.

Beneath the row, two **56px full-width buttons**, 8px apart:

1. "Take a photograph" — orange `#F26A21`, white 18px semibold, camera icon.
   Opens the phone camera directly.
2. "Choose from the phone" — white, 1px navy border, navy 18px semibold.

The camera button is first and orange because the picture is usually being
taken, not found.

**Drag to reorder** is not offered. Instead, each photograph that is not the
main one carries a small ghost button beneath it, 13px semibold navy with a 1px
border: "Make main". One tap, no gesture, because this is being done one-handed.

**Error state:** a file over the limit shows a gold-soft `#FFF6E0` panel, 6px
radius, 12px padding, 13px navy-ink: `"panel-back.jpg" is over 5MB.
Photograph at a smaller size.` — the filename in monospace.

**Behind it:** uploads start the moment a file is chosen and run while the
person is still looking at the screen. The server checks the declared type
**and** the file's own leading bytes, so a renamed file is refused. Maximum
three files, 5MB each.

---

### Screen A4 — Commit the change ★

**This is the screen that makes the section safe.** Nothing written in A2 or A3
is saved until it is committed here.

A **sticky bar fixed to the bottom of the screen**, above the seven-column
navigation bar, white, 1px top border `#DCE3F0`, 12px padding, with a resting
shadow rising off it.

While there is nothing to save the bar is absent entirely.

Once anything has changed it slides up, holding:

- On the left, a summary in two lines: "1 change" or "3 changes" in 13px
  semibold navy, over the changes themselves in 11px monospaced slate, joined by
  middle dots — `KES 118,000 → KES 126,000 · photo added`.
- On the right, a **56px** orange `#F26A21` button, white 18px semibold: "Commit
  change". While saving the label becomes "Committing…" with a spinner and the
  button is disabled.

Beside it, a plain 15px slate "Discard" link that returns every field to where
it started. Discard asks first, in a gold-soft panel: "Throw away the changes
you have made?" with "Yes, discard" and "Keep editing".

**The committed state** replaces the page body with one white card, 24px
padding, centred:

- A 48px circular green `#3FA535` disc with a white check mark.
- "Saved" in 17px semibold green-deep `#2E7D28`.
- The change itself restated in 15px monospaced navy-ink — `KES 118,000 → KES
  126,000`.
- Three buttons stacked, each 48px: "View it on the shop" (orange fill), "Edit
  another" (1px navy border), "Back to products" (1px `#DCE3F0` border).

**Behind it:** one write carrying only the fields that actually changed. The
shop's cached pages for that product are refreshed immediately afterwards, so
the new price is live on the storefront by the time the person looks.

---

### Screen B1 — Set stock

A phone screen. Page title "Set stock", sub-line the product name in 15px slate.

**The count card**, white, 20px padding, everything centred:

- A 12px uppercase letter-spaced slate label: "HOW MANY ARE ON THE SHELF".
- A **stepper**: a 56px circular white button with a 1px `#DCE3F0` border and a
  navy minus, then the count in **48px monospaced medium navy-ink**, then a
  matching plus button. 24px between them. Both buttons press to a mist fill.
- Beneath, a 44px input holding the same number, monospaced, numeric keypad, for
  when the count is 47 rather than 3.

The stepper cannot go below zero. There is no upper limit worth showing.

**The state row** beneath, inside the same card: a 12px uppercase letter-spaced
slate label "SHOWN ON THE SHOP AS", and beneath it a row of four fully-round
selectable chips, 15px medium, 36px tall — "In stock", "Low stock", "On order",
"Call for stock". The selected chip is filled navy with white text; the rest are
white with a 1px `#DCE3F0` border.

**These two controls talk to each other, visibly:**

- Typing `0` snaps the state to a solid navy "Out of stock" pill and dims the
  four chips — a thing with none of it left is not "in stock", whatever anyone
  clicked.
- Choosing "Out of stock" sets the count to `0` in front of the person, so the
  number and the label can never disagree.

A 13px slate line explains it once, beneath the chips: "A count of zero always
shows as out of stock."

**Commit** uses the same sticky bottom bar as Screen A4: "1 change" over
`12 → 47 in stock`, and a 56px orange "Commit change" button.

**Empty state:** where a product has never been counted the figure shows an
em-dash `—` rather than `0`, and a 13px slate line reads "Never counted." A dash
is an absence; a zero is a claim.

**Behind it:** writes the quantity and the shop-facing state together. The
quantity accepts 0 to 100,000. Setting the state to out of stock zeroes the
count server-side as well, so the two cannot drift apart even if the screen is
bypassed.

---

### Screen C1 — Send a payment prompt ★

**The most important screen in this file.** Staff use it to push an M-Pesa
request to a customer who chose pay-on-delivery, without waiting to be standing
at the gate.

It opens from a pay-on-delivery order. Phone width.

Page title "Send a payment prompt" 28px semibold navy, sub-line "The customer
approves it on their handset." 15px slate.

**The order strip**, white card, 16px padding: the order number as a 15px
monospaced navy link, the customer name in 15px navy-ink, and hard right the
order total in 15px monospaced medium navy-ink over an 11px monospaced slate
line reading "ORDER TOTAL".

**The form card**, white, 20px padding, two fields stacked 16px apart:

1. Label "Send to" in 15px medium navy-ink. A **56px** input, 6px radius, 1px
   border, holding the number in **20px monospaced navy-ink**, numeric keypad,
   pre-filled with the number on the order. Beneath, a 13px slate hint: "Pre-
   filled from the order. Change it if they are paying from another phone."
2. Label "Amount" in 15px medium navy-ink. A **56px** input holding the amount
   in **24px monospaced medium navy-ink**, prefixed "KES " in slate, pre-filled
   with the order total.

**The reduce-only rule, drawn explicitly.** The amount may be lowered but never
raised above the order total. When it is lowered, a third field appears with a
200ms slide: a 48px input, "Reason (required)", and a 13px slate line above it
reading "The reason is recorded against the order." The send button stays
disabled and dimmed until at least three characters are typed, and a centred
14px navy-ink line beneath it reads "Enter a reason for the reduced amount
before sending."

If someone types a figure above the total, the input border turns orange
`#F26A21` and a 13px orange-deep line appears: "This cannot be more than the
order total." — never red.

**The send button:** full width, **56px**, orange `#F26A21`, white 18px
semibold, reading "Send prompt — KES 126,000", the figure monospaced.

**The attempt counter**, 11px monospaced slate, centred beneath the button:
"Attempt 1 of 3". On the third it turns orange-deep and reads "Last attempt".
After three the button is replaced by a gold-soft `#FFF6E0` panel, 13px
navy-ink: "Three prompts have been sent for this order. Take payment another
way, or wait before trying again."

**Behind it:** the same request the gate screen sends. The amount is reduce-only
with a mandatory reason, the number may be retargeted, and the server caps
attempts and rate-limits them. Nothing here can charge a customer more than they
agreed to.

---

### Screen C2 — Prompt sent, waiting

The form card is replaced by a gold-soft `#FFF6E0` card with a **2px** gold
`#FDB913` border, 20px padding, everything centred.

- "Prompt sent" 17px semibold navy.
- "They should approve it on 254712345678" 15px navy-ink, the number
  monospaced.
- The amount, enormous — **56px monospaced medium navy-ink**, tight leading.
- Beneath, 15px monospaced slate with the seconds ticking up live: "18s ·
  checking every 3 seconds".

No buttons. The screen is waiting on the customer's handset, and offering an
action here would only invite a double charge.

**Received** turns the card green-soft `#EAF6E8` with a 2px green `#3FA535`
border: a 48px circular green disc with a white check, "Payment received" in
17px semibold green-deep, the amount in 36px monospaced green-deep, then the
11px uppercase letter-spaced green-deep label "M-PESA RECEIPT — READ THIS BACK
TO THE CUSTOMER" over a full-width white bar, 6px radius, 56px tall, holding the
receipt code in 20px monospaced medium navy-ink with wide letter-spacing and a
copy icon hard right.

**Not completed** is a plain white card with a 1px `#DCE3F0` border: "Payment
not completed" 17px semibold navy, the reason in 15px navy-ink — "Request
cancelled by user." — and a **56px** full-width orange button with a refresh
icon, "Try again", which returns to Screen C1 with the attempt counter advanced.

No red, no alarm iconography. A declined payment is routine and the screen
should not embarrass anybody.

---

## §2 What to hold on to

If Stitch drifts, correct it on these:

1. **Every number is monospaced.** Prices, counts, quantities, phone numbers,
   receipts, percentages.
2. **Three colours, three jobs.** Navy structure, green good, orange needs-you.
   Gold only for in-flight.
3. **Never red.** Failures are orange on `#FDEEE6`.
4. **Nothing commits without a commit.** Screens A2, A3 and B1 all write through
   the same sticky bottom bar, and it never appears until something has actually
   changed.
5. **56px buttons and huge figures.** Every screen here is used one-handed,
   often in bright sun.
6. **Empty is an em-dash, never a zero.** A zero is a claim; a dash is an
   absence — which is exactly the difference between "none left" and "never
   counted".
7. **The reduce-only rule is drawn, not hidden.** A person must be able to see
   why the send button is disabled without guessing.
