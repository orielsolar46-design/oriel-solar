# Content guide — for the Oriel Power team

How to change what appears on the site, without a developer. Written for
someone who has not used a website admin before.

---

## Signing in to the admin

Go to **`/admin`** and enter the staff passphrase. You will stay signed in for
about twelve hours.

The menu sits along the **bottom of the screen on a phone** and along the top
on a computer — because most of this gets used standing at a customer's gate.

---

## Taking payment on delivery

This is the screen your drivers use most.

1. Open **Orders** and tap **Out for delivery**, or find the order by number.
2. On the order, you will see a big orange button:
   **Request payment — KES 00,000**.
3. Tap it. The customer's phone receives an M-Pesa request.
4. The screen updates by itself every three seconds. When they approve it, you
   see **Payment received** in green with the **M-Pesa receipt code in large
   type** — read that code back to the customer.
5. Then tap **Mark as delivered**.

### If the amount needs to change

Tap the small pencil beside the amount. You can only reduce it, never increase
it, and you must type a reason. The reason is recorded permanently against the
order with your name on it.

### If the customer pays from a different phone

Tap the pencil and enter the other number before sending.

### What you cannot do, on purpose

**You cannot mark a pay-on-delivery order as delivered until the payment has
actually gone through.** The website refuses, and so does the database behind
it. This protects the business from goods leaving without payment.

You can send at most **three** payment requests per order. After that, call
the office.

---

## Changing a price

Prices are worked out automatically:

```
your dealer cost  →  add the markup  →  add VAT if the supplier quoted without it
→  round up to the nearest KES 100
```

You never type a retail price. You change the **cost** or the **markup**, and
every price on the site follows.

### Changing the markup for everything

Ask your developer to change `RETAIL_MARKUP_PERCENT` and re-run the pricing
script. Every price updates within the hour.

### Updating costs from a new supplier price list

1. Ask the supplier for their list, and save it as **CSV** (in Excel:
   *File → Save As → CSV*).
2. In the admin, go to **Import**.
3. Upload the file.
4. Tell it which column identifies the product and which holds the dealer cost.
   It guesses, and you correct it if wrong.
5. You then see exactly what would change — **Price changed**, **Unchanged**,
   **New**, **Skipped** — with old and new prices side by side.
6. Nothing changes until you approve it.

If a price looks wrong in the preview, stop and check the mapping. It is far
easier to fix before applying than after.

---

## Why some products show no price

You will see **"Price being confirmed"** on some items. That is deliberate.
Those come from supplier lists that did not say whether their prices included
VAT. Rather than guess and either lose margin or overcharge, the site hides the
price and invites the customer to ask.

To fix: confirm with the supplier whether their prices include VAT, then tell
your developer, who will correct the record.

Anything over **KES 500,000** shows **"Request a quote"** with no price at all.
That is intentional — large systems should be quoted per project.

---

## Publishing and unpublishing a product

In **Products**, each item shows whether it is published. Unpublished items are
invisible to customers but stay in your catalogue — useful for spares, or for
items you are not currently stocking.

Items with **no imagery** are flagged. A product with no photograph shows a
branded placeholder; it will sell better with a real photograph.

---

## Adding photographs

Save photographs into `public/products/<category>/<product-slug>/` as
`01.webp`, `02.webp` and so on. Two per product minimum, three or four for
important ones.

Good photographs: straight-on against a white background, an angled view, and a
close-up of the terminals or display. Your developer can convert ordinary JPEGs
to the right format.

**Please do not use photographs from a manufacturer's website that you do not
have permission to use**, and never use a photograph of someone else's
installation as if it were yours.

---

## Writing a new article

Articles live in `content/blog/` as plain text files ending in `.md`. Copy an
existing one to see the pattern. The top of each file looks like this:

```
---
title: What size solar system does a Kenyan home actually need?
description: One or two sentences shown on the guides page and in Google.
category: Sizing
published: 2026-07-31
---
```

Then write normally. A few formatting marks:

| To do this | Type this |
|---|---|
| A section heading | `## Your heading` |
| A smaller heading | `### Your heading` |
| **Bold** | `**your words**` |
| A bulleted list | `- your point` at the start of the line |
| A numbered list | `1. your point` |
| A link | `[the words](/the-page)` |

Save the file and the article appears after the next deployment.

### What makes a good article here

The site's whole position is that Oriel is an engineering company, not a shop.
So: real numbers, honest limits, and Kenya-specific detail. If an article could
have been written about anywhere in the world, it is not doing its job.

---

## Adding a completed project

The projects page is deliberately empty until you have real installations to
show, with the customer's permission.

To add one, your developer adds an entry to `src/lib/content/projects.ts` with
the title, county, system size, a description and photographs.

**Please do not add projects you have not actually done.** The site's
credibility rests on everything on it being true.

---

## The enquiry queues

| Where | What arrives there |
|---|---|
| **Quotes** | Quotation requests, site-survey bookings, warranty registrations |
| **Inbox → Call-backs** | The "request a call back" form, with a tap-to-call button |
| **Inbox → Calculator leads** | People who asked for their sizing by email, with the system it recommended |
| **Payments** | Every M-Pesa attempt, for checking against your M-Pesa statement |

---

## Things to leave alone

- **Do not change the colours.** They come from your logo and are set in one
  file. Changing them piecemeal will break the contrast checks that make the
  site readable for everyone.
- **Do not invent statistics, testimonials or certifications.** Several places
  on the site are deliberately blank waiting for real figures — the savings
  band on the home page, the credentials section on About. Blank is better than
  wrong.
- **Do not remove the "pay on delivery is by M-Pesa, not cash" wording.** It
  appears in the checkout, the confirmation SMS, the email and the order page
  because customers otherwise arrive at handover holding cash.

---

## Getting help

Anything not covered here — or anything that looks wrong — is a question for
your developer. If a price looks wrong, **stop selling that item and ask**
before it costs you margin.
