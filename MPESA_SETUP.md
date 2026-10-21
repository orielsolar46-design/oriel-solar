# M-Pesa setup — sandbox to production

Everything below concerns the Safaricom Daraja **Lipa na M-Pesa Online (STK
Push)** integration. Both payment options on the site use this same
mechanism; they differ only in *when* the push is sent.

---

## 1. What the client must decide first

| Decision | Why it matters |
|---|---|
| **Paybill or Till** (`{{MPESA_SHORTCODE}}`) | Determines the shortcode and the `TransactionType`. The code currently sends `CustomerPayBillOnline`, which is correct for a **Paybill**. For a **Till (Buy Goods)** this must change to `CustomerBuyGoodsOnline` — one line in `src/lib/mpesa/client.ts`. Confirm before go-live. |
| **Production callback URL** | Must be HTTPS, publicly reachable, and registered with Safaricom. |

---

## 2. Environment variables

```
MPESA_CONSUMER_KEY=        # from the Daraja app
MPESA_CONSUMER_SECRET=     # from the Daraja app
MPESA_SHORTCODE=           # paybill or till number
MPESA_PASSKEY=             # Lipa na M-Pesa Online passkey
MPESA_ENVIRONMENT=sandbox  # sandbox | production
MPESA_CALLBACK_URL=https://<your-domain>/api/mpesa/callback
```

**None of these are ever exposed to the browser.** They have no
`NEXT_PUBLIC_` prefix, and every Daraja call runs inside a server-side route
handler. Do not add the prefix to any of them.

### Simulator mode (development only)

If the five variables above are **absent**, the integration runs in a built-in
simulator so both flows can be developed and demonstrated without
credentials. The outcome is chosen by the **last digit of the paying phone
number**:

| Last digit | Simulated outcome | Daraja `ResultCode` |
|---|---|---|
| `0` | Payment succeeds | 0 |
| `1` | Customer cancels on the phone | 1032 |
| `2` | Phone doesn't respond | 1037 |
| `3` | Insufficient funds | 1 |
| `4` | Wrong PIN | 2001 |
| `5` | **Succeeds, but the callback never arrives** — exercises the fallback | 0 |

The simulator **refuses to run when `MPESA_ENVIRONMENT=production`**: the
client throws rather than simulate against real money. Delete the simulator
files once sandbox credentials are in place if you prefer; nothing else
imports them.

---

## 3. Getting sandbox credentials

1. Create an account at <https://developer.safaricom.co.ke>.
2. Create an app and subscribe it to **Lipa Na M-Pesa Sandbox**.
3. Copy the Consumer Key and Consumer Secret into `.env.local`.
4. Sandbox shortcode is `174379` and the sandbox passkey is published in the
   Daraja portal's test credentials page.
5. Sandbox test MSISDNs are listed in the portal; they always approve.

### Exposing the callback in development

Daraja must reach your callback over HTTPS, so `localhost` will not work. Use
a tunnel:

```bash
npx localtunnel --port 3000
# or
cloudflared tunnel --url http://localhost:3000
```

Set `MPESA_CALLBACK_URL` to `https://<tunnel-host>/api/mpesa/callback`.

---

## 4. Going to production

1. Apply for **Go Live** in the Daraja portal; Safaricom issues production
   credentials against the client's real paybill or till.
2. Register the production callback URL with Safaricom. It must be the exact
   HTTPS URL of `/api/mpesa/callback` on the live domain.
3. Set `MPESA_ENVIRONMENT=production` and replace all five variables in the
   Vercel project's environment settings (Production scope).
4. Confirm the `TransactionType` matches paybill vs till (section 1).
5. Place one small real transaction end to end before announcing the site.

**Safaricom may whitelist callback IPs.** If callbacks stop arriving in
production, that is the first thing to check — the status-query fallback
(section 5) will keep payments resolving correctly meanwhile, which is
exactly why it exists.

---

## 5. How the flows behave

### Flow A — pay now
1. Customer places the order → order is `pending_payment`, payment row
   `initiated`.
2. `initiateSTKPush` is called with the amount as an **integer** (Daraja
   rejects decimals) and `AccountReference` = the order number.
3. Customer lands on `/order/[orderNumber]?token=…` showing the waiting
   panel: pulsing sun arc, the amount in mono, three helper steps, countdown.
4. The page polls `/api/mpesa/status/<CheckoutRequestID>` every 4 seconds
   while Daraja posts to `/api/mpesa/callback` in parallel.
5. **Resolution comes from the callback**, not the poll.
6. Failures map to plain language: 1032 cancelled, 1037 no response, 1
   insufficient funds, 2001 wrong PIN. The customer is offered *Try again*
   and *Use a different number*.

### Flow B — pay on delivery (still M-Pesa, never cash)
1. Order is created as `pending_cod`. **No push is sent.** The confirmation
   email and SMS both state that payment will be by M-Pesa at handover.
2. Staff move the order `processing` → `out_for_delivery`.
3. At the customer's gate, staff trigger
   `POST /api/admin/orders/<orderNumber>/request-payment`.
4. The amount may be edited **downwards only**, and only with a mandatory
   reason, which is logged against the order.
5. Staff may resend up to **three times** per order and may retarget a
   different phone number if the customer pays from another line.
6. Once a payment is `paid`, the order may be marked `delivered` — and not
   before (section 6).

---

## 6. Hardening — what is enforced, and where

| Guard | Where | Verified |
|---|---|---|
| Server recalculates every amount from the order total | `startPayment()` | Upward edits refused |
| Amount is an integer | `initiateSTKPush()` | Daraja rejects decimals |
| Duplicate callbacks ignored | unique `checkoutRequestId` + `updatePaymentByCheckoutId` | 3 identical callbacks → 1 payment |
| Callback route always returns `{"ResultCode":0,"ResultDesc":"Accepted"}` with HTTP 200, even on internal error | `/api/mpesa/callback` | Non-200 would make Daraja retry forever |
| Missing callback resolved by status query after 150s, before any failure is declared | `/api/mpesa/status/[id]` → `resolveViaStatusQuery()` | Dropped-callback case resolves as **paid** |
| Rate limiting | `checkRateLimit()` | 5 per phone / 40 per IP per 15 min |
| Every request and response logged with secrets redacted | `logMpesa()` / `redact()` | No key, secret, passkey or Authorization value is ever written |
| COD cannot be delivered unpaid | `updateOrderStatus()` + DB trigger | Blocked until a paid payment exists |

### Why the per-IP limit is 40, not 5
The brief specifies 5 per 15 minutes per IP and per phone. **Per phone is 5,
exactly as specified.** Per IP is deliberately looser because Kenyan mobile
networks place large numbers of subscribers behind carrier-grade NAT — many
unrelated customers share one public address, and a 5-per-IP rule would lock
out genuine buyers. 40 still stops scripted abuse from one host. Recorded in
`DECISIONS.md`.

### Multi-instance hosting
Rate-limit counters are in-process. On a single Vercel instance this is
correct. If the deployment scales to multiple instances, move the counters to
a shared store (Upstash Redis or a Supabase table) — the interface in
`src/lib/mpesa/rate-limit.ts` is a single function, so this is a contained
change.

---

## 7. Staff authentication on the COD trigger

Until the Supabase Auth admin dashboard lands (Stage 8), the COD endpoint is
guarded by a shared secret in the `x-staff-key` header, compared against
`ADMIN_STAFF_KEY`.

**The route refuses to run at all when `ADMIN_STAFF_KEY` is unset** (HTTP
503), so it can never be left open by accident. Stage 8 replaces this with
per-user Supabase Auth sessions and role checks.

---

## 8. Reconciliation

Every Daraja exchange is written to the M-Pesa log with secrets redacted:
direction, endpoint, order number, `CheckoutRequestID`, payload and
timestamp. Reconcile against the client's M-Pesa statement by
`MpesaReceiptNumber`.

One caveat worth knowing: when a payment is resolved by the **status-query
fallback** rather than a callback, Daraja's query response does not include
the receipt number. Those payments are recorded with `resolvedBy:
status-query-fallback` and no receipt; match them to the statement by amount,
phone and timestamp.
