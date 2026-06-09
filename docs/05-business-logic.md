# 05 — Reservation · Payment · Admin Panel Logic

## J. Reservation logic

### J.1 Status state machine
```
NEW_REQUEST ─┬─▶ WAITING_PAYMENT ─▶ PAYMENT_RECEIVED ─▶ CONFIRMED ─┬─▶ WAITING_SUPPLIER ─▶ COMPLETED
             │                                                      └─▶ COMPLETED
             └─▶ CANCELLED                                          
any(pre-travel) ─▶ CANCELLED ─▶ REFUNDED        CONFIRMED/PAYMENT_RECEIVED ─▶ CANCELLED ─▶ REFUNDED
```
Allowed transitions (server-enforced in `statusMachine.ts`):
| From | → To |
|------|------|
| NEW_REQUEST | WAITING_PAYMENT, CONFIRMED, CANCELLED |
| WAITING_PAYMENT | PAYMENT_RECEIVED, CANCELLED |
| PAYMENT_RECEIVED | CONFIRMED, WAITING_SUPPLIER, CANCELLED |
| CONFIRMED | WAITING_SUPPLIER, COMPLETED, CANCELLED |
| WAITING_SUPPLIER | CONFIRMED, COMPLETED, CANCELLED |
| CANCELLED | REFUNDED |
| COMPLETED / REFUNDED | (terminal) |

Side-effects on transition: enter `CONFIRMED` → confirm seats (hold→sold), send confirmation,
generate voucher; enter `CANCELLED` → release seats, open refund if paid; enter `COMPLETED`
→ stamp `completedAt`, request review. Every transition writes `audit_logs` (before/after).

### J.2 Quota & seat-hold concurrency (oversell-proof)
Inventory truth lives on `tour_dates`: `remaining = quota − seatsSold − seatsHeld`.
- **Hold** (wizard step 2), in a transaction:
  ```sql
  UPDATE tour_dates SET seatsHeld = seatsHeld + :n
  WHERE id = :id AND (quota - seatsSold - seatsHeld) >= :n;   -- 0 rows ⇒ sold out
  ```
  then insert `seat_holds(expiresAt = now()+20m)`. The conditional UPDATE is the lock — no oversell even under race.
- **Sweeper** (cron `/api/webhooks/holds/sweep`, every 2–5 min): for expired holds, `seatsHeld -= seats` and delete the hold.
- **Convert** (step 9 create): validate hold not expired, then in one transaction create the reservation and `seatsHeld -= n` / `seatsSold += n`. If hold expired, re-acquire via the conditional UPDATE or fail gracefully back to step 2.
- **Confirm without prepay** (admin path): same conditional UPDATE directly into `seatsSold`.
- **Cancel**: `seatsSold -= n` (or `seatsHeld` if not yet sold); set status FULL/ACTIVE accordingly.
- **Low-quota alert**: when `remaining <= threshold` (setting, default 5) fire `LOW_QUOTA`.

### J.3 Pricing engine (`pricing/quote.ts`)
Deterministic, server-side; called at steps 5–7 and on every `/quote`. Inputs: `tourDateId`,
passengers[{paxType, roomTypeId}], extras[{id, qty}], campaignCode?, asOf date.

```
1. roomGrouping: assign passengers to rooms by roomType occupancy → count rooms, detect
   single travelers (occupancy SINGLE) → single supplement applies.
2. perPax price: for each passenger, look up tour_prices(tourDateId, roomTypeId, paxType).
   - child age-band: pick CHILD_WITH_BED / CHILD_NO_BED / INFANT by birthDate vs childMin/MaxAge.
   - phase price: if asOf <= earlyBirdUntil → earlyBirdPriceMinor; if asOf >= lastMinuteFrom
     → lastMinutePriceMinor; else priceMinor.
3. subtotal = Σ perPax prices (single supplement is just the SGL-room price row).
4. extras = Σ (extra.priceMinor × qty × (perPax ? paxCount : 1)).
5. discount: apply campaign (percentOff or amountOff) to subtotal if valid window + scope.
6. totalEUR = subtotal + extras − discount.
7. fx: rate = currentEurTryRate(asOf) (snapshot). totalTRY = round(totalEUR × rate).
8. return line items {label, paxType, minor, currency} + totals in EUR and TRY + rate used.
```
**Snapshot rule:** the rate and all line totals are persisted on the reservation at creation
(`exchangeRate`, `exchangeRateAt`, `*Minor`). Later FX moves never change an existing reservation.
Re-quote on the server before create — **never trust client-sent totals.**

### J.4 Reference number
`TA-` + Crockford base32 of a sequence+random → e.g. `TA-2K7F9Q`. Unique, URL-safe,
phone-dictatable, used for lookup and vouchers.

### J.5 Passenger validation (Zod)
Adults ≥1; each pax: name required; for international tours passport No + expiry required and
**expiry ≥ return date + 6 months** (warn if not); infant age < 2 at travel; child bands by age;
emergency contact required for lead pax; KVKK consent checkbox required to submit.

---

## K. Payment logic

### K.1 Methods & flows
| Method | Flow | Resulting status |
|--------|------|------------------|
| `BANK_TRANSFER` | Show IBAN + reference; customer transfers; staff records payment on receipt | NEW→WAITING_PAYMENT→PAYMENT_RECEIVED |
| `CREDIT_CARD` (online) | Redirect/3DS via `PaymentProvider` (iyzico/Stripe); webhook confirms | →PAYMENT_RECEIVED on `SUCCEEDED` |
| `AGENCY_CREDIT` (B2B) | Debit agency balance if within credit limit; instant | →PAYMENT_RECEIVED |
| `CASH` | Office payment, staff records | →PAYMENT_RECEIVED |
| `PARTIAL` | Deposit now, balance by due date; reminders until cleared | stays WAITING_PAYMENT until balance 0 |
| "Agency will contact" | No payment; lead-style follow-up | NEW_REQUEST |

### K.2 Provider abstraction
```ts
interface PaymentProvider {
  createCheckout(res: Reservation, amountMinor: number): Promise<{ redirectUrl, ref }>
  verifyWebhook(req): Promise<{ ref, status, amountMinor, raw }>
  refund(ref: string, amountMinor: number): Promise<{ ok, ref }>
}
```
Default `iyzico` (TRY, 3DS), `stripe` for international/B2B. Selected via settings. All money in TRY at checkout (already snapshotted). Webhooks are signature-verified and **idempotent** (dedupe on `providerRef`).

### K.3 Ledger sync (always in a transaction)
On any `payments` insert/update or `refunds` processed:
```
paidMinor   = Σ payments(status=SUCCEEDED).amount − Σ refunds(status=PROCESSED).amount
balanceMinor = totalMinor − paidMinor
if balanceMinor <= 0 and status == WAITING_PAYMENT → PAYMENT_RECEIVED (+notify)
```
Partial payments allowed; overpayment blocked. Refund cannot exceed paid.

### K.4 Refunds & cancellation fees
Cancellation policy (per tour/date) defines fee bands by days-to-departure (e.g. >30d: 10%,
15–30d: 50%, <15d: 100%). On cancel: `refundable = paid − cancellationFee`; create `refunds`
(REQUESTED→APPROVED by ACCOUNTING→PROCESSED via provider/bank). Status → CANCELLED → REFUNDED.

### K.5 B2B accounting
On B2B reservation confirm: accrue `commissions(basis=net, percent=agency.commissionPercent)`;
`AGENCY_CREDIT` payments debit `agencies.balanceMinor`; statement = chronological ledger of
payments + commissions + manual adjustments; block new bookings if balance exceeds credit limit.

---

## L. Admin panel logic

### L.1 Dashboard queries (cached 60s)
KPIs: counts by status; revenue = Σ SUCCEEDED payments in range; outstanding = Σ balanceMinor
of open reservations; upcoming departures (next 30d) with fill %; low-quota list; cancellations
(period); unread messages. Charts: sales by day, by destination, by channel.

### L.2 Reservation grid
Server-driven `DataTable`: filters (status, destination, date range, customer, payment status,
assigned agent, channel, agency); sort; pagination; bulk (assign, export, status where legal);
saved filter views. Row → detail. CSV/XLSX export streams server-side.

### L.3 Tour & date editor
`TourForm` tabbed; slug auto-generated + uniqueness check; publishing requires ≥1 image,
≥1 active date with a complete price grid (validation gate). `PriceGridEditor` renders the
date × room × pax matrix; bulk actions (copy prices across dates, %-bump, set early-bird window).
Saving a date recomputes `status` (FULL when remaining 0).

### L.4 Operations generation
Per `tourDate`, build lists from reservations + passengers:
- **Pax list**: name, paxType, passport, status, balance.
- **Rooming**: group passengers by `roomGroup`/roomType → room assignments.
- **Transfer**: pax × arrival/departure transport.
- **Passport**: name, nationality, passportNo (decrypted, permissioned), expiry — for visa/DMC.
- **Hotel allocation**: rooms per hotel from `tour_date_allocations`.
- **Guide / emergency**: guide assignment; emergency contacts.
Export via `exceljs` (xlsx) / `@react-pdf/renderer` (pdf). Passport/sensitive exports require
`operations:manage` + are audited (who exported what, when).

### L.5 Voucher & proforma
`VoucherPreview`/`ProformaPreview` render from reservation + tour + date + passengers; generate
PDF, store as `documents` (type VOUCHER/PROFORMA), attachable to confirmation email. Proforma
includes line items, taxes, agency/customer details, payment instructions.

### L.6 Assignment & SLA
Reservations auto-assignable (round-robin among SALES_AGENT) or manual; "unassigned + NEW > 1h"
surfaces as an admin alert. Internal notes are staff-only, never exposed to customer/B2B.

### L.7 Audit & activity
Every staff/B2B mutation → `audit_logs(actor, action, entity, before, after, ip)`. Admin
"Activity" view filters by actor/entity/date. Sensitive reads (passport export) logged too.
