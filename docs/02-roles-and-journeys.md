# 02 — Roles & Permissions · User Journeys · Admin Workflows

## C. User roles and permissions

### C.1 Role catalog
| Role | Realm | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | staff | Full access incl. settings, users, integrations, audit. |
| `SALES_AGENT` | staff | Reservations + customers + payments (record), read tours. |
| `OPERATIONS` | staff | Departures, operation lists, supplier confirmation, documents. |
| `ACCOUNTING` | staff | Payments, refunds, commission, reports; read reservations. |
| `CONTENT_EDITOR` | staff | Tours, blog, FAQ, campaigns, SEO, testimonials, legal pages. |
| `AGENCY_USER` | b2b | Sub-agency operator: book at B2B prices, own reservations only. |
| `CUSTOMER` | customer | Own reservations, documents, messages, favorites. |

RBAC is **permission-based**, roles are bundles of permissions (so a SUPER_ADMIN can mint a
custom role later). Permission key = `resource:action`, optionally scoped (`:own`, `:agency`).

### C.2 Permission matrix (✔ allow · ◐ own/scoped · — none)

| Permission | SUPER | SALES | OPS | ACCT | CONTENT | AGENCY | CUSTOMER |
|---|---|---|---|---|---|---|---|
| `dashboard:view` | ✔ | ✔ | ✔ | ✔ | ✔ | ◐ | — |
| `tour:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔(public) |
| `tour:write` | ✔ | — | — | — | ✔ | — | — |
| `tourdate:write` (quota/price) | ✔ | — | ◐ | — | ✔ | — | — |
| `reservation:read` | ✔ | ✔ | ✔ | ✔ | — | ◐agency | ◐own |
| `reservation:create` | ✔ | ✔ | ✔ | — | — | ✔(B2B) | ✔(self) |
| `reservation:status` | ✔ | ✔ | ✔ | — | — | — | request only |
| `reservation:assign` | ✔ | ✔ | — | — | — | — | — |
| `reservation:cancel` | ✔ | ✔ | ◐ | — | — | request | request |
| `payment:record` | ✔ | ✔ | — | ✔ | — | own(B2B) | online self |
| `refund:manage` | ✔ | — | — | ✔ | — | — | — |
| `commission:view` | ✔ | — | — | ✔ | — | ◐own | — |
| `operations:manage` | ✔ | — | ✔ | — | — | — | — |
| `document:upload` | ✔ | ✔ | ✔ | — | — | ◐own | ◐own |
| `voucher:generate` | ✔ | ✔ | ✔ | ✔ | — | ◐own | download own |
| `report:view` | ✔ | — | — | ✔ | — | ◐own | — |
| `b2b:manage` (agencies) | ✔ | ✔ | — | — | — | — | — |
| `content:write` (blog/faq) | ✔ | — | — | — | ✔ | — | — |
| `user:manage` / `role:manage` | ✔ | — | — | — | — | — | — |
| `settings:write` | ✔ | — | — | — | — | — | — |
| `audit:view` | ✔ | — | — | ◐acct | — | — | — |

**Enforcement:** middleware guards route groups by realm; server actions/route handlers call
`requirePermission(perm, {scope})`. Scoped reads inject `WHERE agencyId = session.agencyId`
or `WHERE customerId = session.customerId`. Never trust client-supplied scope.

### C.3 Auth model
- Three login surfaces: customer, staff (`/admin`), B2B (`/b2b`) — same Auth.js core, different callbacks.
- Sessions carry `{ userId, realm, roles[], permissions[], agencyId?, customerId? }`.
- Staff require email-verified + (optional) 2FA for SUPER/ACCOUNTING.
- Failed-login lockout + rate limit (doc 06).

---

## D. User journey flows

### D.1 Customer — discover → reserve (happy path)
```
Home ──search(dest, date, pax, price)──▶ Tour listing (filtered)
  └─ click card ─▶ Tour detail (price table + dates visible)
        └─ "Rezervasyon Yap" ─▶ Reservation wizard
             1 Tour (prefilled)
             2 Departure date  ──reads remaining seats
             3 Pax count (adult/child/infant)
             4 Passenger details (per pax: name, DOB, nationality, passport)
             5 Room type (DBL/SGL+supp/TRP)  ──recompute price live
             6 Optional extras (visa, insurance, excursions)
             7 Review total (line items, TRY @ snapshot rate)
             8 Payment method: [Online card] [Bank transfer] [Agency will contact]
             9 Create reservation ─▶ Reference number
  └─ Confirmation screen (ref, summary, next steps, WhatsApp/email sent)
```
**Guarantees:** price recomputed at steps 5–7 server-side; a soft **seat hold** is placed at
step 2 (TTL 20 min) so the wizard can't oversell; on step 9 the hold converts to a booking
inside a DB transaction (doc 05). Abandon → hold expires → seats released.

### D.2 Customer — track & manage
```
"Rezervasyon Sorgula" ─(ref + email/phone)─▶ Status page (status, balance due, docs needed)
Register/Login ─▶ Account ─▶ {reservations, upload passport, pay balance, message agency,
                              request change/cancel, favorites}
```

### D.3 B2B sub-agency
```
/b2b login ─▶ B2B catalog (NET prices + commission shown)
  └─ Create reservation for end-customer (enters pax) 
       ─▶ Pay by [agency balance] or [card] ─▶ Voucher download
  └─ My reservations (scoped) · Balance & statement · Commission report
```

### D.4 Lead capture (no booking yet)
Contact form / WhatsApp CTA / "agency will contact me" → `leads`/`messages` → admin inbox →
sales agent converts to reservation.

---

## E. Admin workflows

### E.1 Create & publish a tour (Content editor)
1. Create destination if missing → 2. New tour (title, slug auto from title, summary, description)
→ 3. Itinerary day-by-day → 4. Upload gallery (alt text) → 5. Included/excluded services
→ 6. Define room types & child age-bands → 7. Add departure dates (date, quota, base price, currency)
→ 8. Set prices per date × room type (adult/child/infant, single supp, early-bird, last-minute)
→ 9. Optional extras + campaign discount → 10. SEO fields + FAQ + per-tour terms
→ 11. Visibility = published. Audit row written; sitemap revalidated.

### E.2 Handle an inbound reservation (Sales agent)
1. New reservation appears on dashboard / assigned. 2. Open detail → verify pax & price.
3. If "agency will contact": call customer, confirm, set method. 4. Record payment (or send pay link).
5. Status → `WAITING_PAYMENT` → on receipt `PAYMENT_RECEIVED` → `CONFIRMED`.
6. Generate voucher; send confirmation email. 7. Add internal notes; assign ops if needed.

### E.3 Run a departure (Operations)
1. Filter reservations by departure date. 2. Watch quota & supplier-confirmation status.
3. Chase missing passports (missing-doc reminders). 4. Generate **operation lists**
(pax, rooming, transfer, passport, hotel allocation, guide, emergency contacts) → export Excel/PDF
to suppliers. 5. Mark supplier confirmation per date. 6. Close date when full/cutoff.

### E.4 Close the books (Accounting)
1. Reconcile collections vs reservations (outstanding list). 2. Record supplier payments.
3. Track agency commission (esp. B2B). 4. Process refunds against cancellations.
5. Run daily/monthly sales + revenue reports; export. Currency handled via snapshot rates.

### E.5 Manage a sub-agency (Sales/Super admin)
Create agency → set pricing tier + commission % + credit limit → invite agency user →
monitor their reservations, balance, statements; top-up/adjust balance (audited).

### E.6 Governance (Super admin)
Users & roles, integration keys, notification templates, settings, audit-log review, backups.
