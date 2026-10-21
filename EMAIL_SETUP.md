# Email and documents — setup

Everything the shop sends by email, and the invoices and receipts it produces.

---

## 1. The one thing that must be done before launch

**`orielpower.com` is not yet verified in Resend, so no email can be sent.**

This was checked on 2026-08-07. The API key works — a test message from
`onboarding@resend.dev` was accepted — but sending from `orders@orielpower.com`
is refused:

```
403  The orielpower.com domain is not verified.
     Please, add and verify your domain on https://resend.com/domains
```

That refusal is correct and deliberate. The code does **not** quietly fall back
to a `resend.dev` sender: putting somebody else's domain on this company's
receipts would be worse than not sending them. Instead the failure is recorded
in the `email_log` table, and the clerk is told to use WhatsApp instead.

### To fix it

1. Sign in at <https://resend.com/domains> and click **Add Domain**.
2. Enter `orielpower.com`. Choose the region closest to Kenya.
3. Resend shows three DNS records — a DKIM `TXT`, an SPF `TXT`, and usually a
   `MX` for return-path handling.
4. Add them **at Cloudoon**, which is authoritative for this domain
   (`ns1.cloudoon.com` / `ns2.cloudoon.net` / `ns3.cloudoon.org`) — not at
   Vercel. This is the same panel where the `A` record and the Google
   verification `TXT` were added.
5. Back in Resend, press **Verify**. It usually takes a few minutes.
6. Send a test from the back office: open any issued document and email it to
   your own address.

Until step 6 passes, every automatic email fails. Orders, payments and status
changes all still work — only the email does not.

> **Do not skip SPF and DKIM.** Without them Gmail files the shop's receipts as
> spam, which is barely better than not sending at all.

---

## 2. Environment variables

| Variable | What it does |
| --- | --- |
| `RESEND_API_KEY` | The sending key. Without it nothing is sent: every message is written to `email_log` with status `skipped` and printed to the server console in full, so the copy can still be reviewed. |
| `EMAIL_FROM` | The From address. Must be on a domain verified in Resend. Default `Oriel Power Ltd <orders@orielpower.com>`. |
| `EMAIL_REPLY_TO` | Where a customer's reply lands. Default `info@orielpower.com`. Deliberately not a no-reply address. |
| `ORDER_NOTIFICATION_EMAIL` | The shop's own copy of every new order. |
| `ORIEL_KRA_PIN` | Oriel Power Ltd's own KRA PIN, printed in the header of every document. **Still needed** — see section 4. |

Set all of these on the Vercel production project as well as in `.env.local`.

The key currently in `.env.local` was shared in a chat message. **Rotate it in
the Resend dashboard before launch**, the same way the Supabase service key
needs rotating.

---

## 3. What gets sent, and when

| Trigger | Who gets it | Attachment |
| --- | --- | --- |
| Order placed (pay now **and** pay on delivery) | Customer | Invoice PDF |
| Order placed | The shop (`ORDER_NOTIFICATION_EMAIL`) | — |
| M-Pesa payment confirmed | Customer | Receipt PDF |
| Status → Processing | Customer | — |
| Status → Out for delivery | Customer | — |
| Status → Delivered | Customer | Receipt PDF (again, for filing) |
| Status → Cancelled / Refunded / Payment failed | Customer | — |
| Staff presses "Email it" on any document | Customer | That document's PDF |

Statuses not in that list send nothing on purpose. `pending_payment` and
`pending_cod` are already covered by the order confirmation, and `paid` is
covered by the payment receipt.

Nothing in this path can fail an order. If Resend is down the order is still
taken, the payment is still banked, the status still moves — and the failure is
in `email_log` with its reason.

---

## 4. The documents themselves

### Numbering

- Invoices `ORL-INV-YYMM-NNNN`
- Receipts `ORL-RCP-YYMM-NNNN`

A number is allocated when a document is **issued**, not when it is written, so
an abandoned draft does not leave a hole. Issuing twice is a no-op. A voided
document keeps its number for ever and prints VOID across its face.

**Before the first real sale**, reset the counters — the test run during the
build consumed a few. Paste this into the Supabase SQL Editor:

```sql
-- Only ever run this on a database with no real documents in it.
select setval('invoice_number_seq', 1, false);
select setval('receipt_number_seq', 1, false);
```

### Tax invoices — what is still outstanding

The client confirmed on 2026-08-07 that Oriel Power Ltd is ETR-registered, so
invoices are titled **TAX INVOICE**. Two things are still needed before one
would actually be accepted as such:

1. **Set `ORIEL_KRA_PIN`.** A tax invoice must identify the supplier by PIN.
   The line prints in the header from that variable and does not render at all
   while it is blank — nothing invented reaches a customer, but nothing
   compliant does either.
2. **eTIMS / Control Unit details are not implemented.** A compliant invoice
   carries a CU serial, a CU invoice number and a KRA verification QR code, all
   issued by the signing device or the OSCU/VSCU API. That is a separate piece
   of work needing the client's device details; it has not been guessed at,
   because a document that looks compliant and is not is worse than one that is
   plainly incomplete.

The buyer's KRA PIN **is** printed when it has been entered — that is what lets
a business customer reclaim the input VAT, so ask for it at the counter.

### VAT

Three modes, chosen per document:

- **Add VAT on top** — the prices typed in are before VAT. This is how the
  paper pad works, and it is the default for anything written at the counter.
- **Prices already include VAT** — the VAT is worked back out of them. Every
  document generated from a web order uses this, because every price on the
  website is VAT-inclusive retail. The line prices on the receipt therefore
  match the prices the customer saw on the site, to the shilling.
- **No VAT** — nothing added, no VAT line printed.

The split is always computed from the total, never line by line, so subtotal +
VAT always equals the total exactly.

### The line total is editable

It works itself out as quantity × unit price, and stops doing so the moment it
is typed over — the field turns gold to show it was set by hand, with a link to
recompute it. This exists because the client's own sample receipt lists a 300L
heat pump at 199,940 and charges 180,940.

### Printing

- **Both copies** — one A4 sheet, ORIGINAL above the fold, DUPLICATE below,
  tear line between. This is the one to print; it is the pad.
- **Original** — the customer's copy, on its own. This is what gets emailed and
  what to attach in WhatsApp.
- **Duplicate** — the office copy, on its own.

Page size is A4 width by half A4 height, measured from the two sample PDFs the
client supplied.

### Sending to a customer with no email address

Roughly half of them have none. Open the document and press **Send it on
WhatsApp**: it opens WhatsApp with the message and a private link to the
document ready to send. The link is guarded by a random token and serves the
original copy only — never the office duplicate.

To send the file itself rather than a link, download the original and attach it
in WhatsApp. No messaging deep link can carry an attachment, so this is the
only way and it is two taps.

---

## 5. Where things live

```
src/lib/documents/types.ts       the model, the money arithmetic, the tick boxes
src/lib/documents/pdf.ts         the printed document, drawn with pdf-lib
src/lib/documents/store.ts       persistence, numbering, issue / pay / void
src/lib/documents/from-order.ts  turning a web order into an invoice or receipt
src/lib/documents/schema.ts      what the back office may send
src/lib/email/client.ts          Resend transport + the email_log audit trail
src/lib/email/templates.ts       every message, HTML and plain text
src/lib/orders/notifications.ts  what fires when

src/app/admin/invoices/          the back-office screens
src/app/document/[docNumber]/    the customer's own copy, token-guarded
supabase/migrations/0005_documents.sql
```

To preview the printed design without starting the app:

```bash
npx tsx --conditions=react-server scripts/preview-document.ts ./out
```

The `--conditions=react-server` flag is required, not decoration — see the
comment at the top of that script.

---

## 6. Checking what was sent

`email_log` records every attempt with its status (`sent`, `failed`,
`skipped`), the provider's message id, and the error where there was one. When
a customer rings to say they never got their receipt, that table is the answer.
Each document also carries `last_sent_at` and `last_sent_to`, shown on its page
in the back office.
