# 01 — Product Requirements Document + Feature List

## A. Product Requirements Document

### A.1 Vision
A modern, fast, trustworthy B2C tour-operator website backed by a serious back-office that
runs real agency operations — reservations, quota, pricing, payments, operations lists,
accounting — plus a B2B portal for partner sub-agencies. The customer-facing experience is
premium and Turkish-first; the admin is practical and dense, optimized for staff throughput.

### A.2 Problem statement
Tour operators sell finite, dated inventory (departures with quotas) at variable prices
(date × room type × passenger type × campaign × currency). Off-the-shelf booking widgets and
generic CMS sites can't model allotment, single supplements, supplier confirmation, rooming
lists, or agency commission. Spreadsheets and WhatsApp fill the gap and break at scale.
This platform replaces that with one source of truth from **search → reservation → operation → accounting**.

### A.3 Goals & non-goals
**Goals**
- Customer can reserve a dated package tour in **under 2 minutes**, price always visible.
- Agency manages the full lifecycle of a departure without leaving the system.
- Accurate, race-free quota and pricing under concurrent bookings.
- KVKK/GDPR-compliant handling of passenger & passport data.
- SEO-dominant on Turkish tour keywords (`mısır turları`, `moskova turu`…).

**Non-goals (v1)**
- Dynamic flight/hotel sourcing via GDS/XML (architected for later, not built).
- Native mobile apps (responsive web only).
- Full multi-currency checkout (display TRY, base EUR; multi-currency collection later).
- Marketplace of third-party operators (single-tenant agency, B2B sub-agencies excepted).

### A.4 Target users (personas)
1. **Ayşe — leisure customer.** Mobile, price-sensitive, wants clear dates and what's included. Books for a family (2 adults + 1 child).
2. **Mehmet — sales agent.** Handles inbound reservations & WhatsApp leads, needs fast reservation entry and status updates.
3. **Zeynep — operations staff.** Owns departures; generates rooming/transfer/passport lists, chases supplier confirmation.
4. **Can — accounting.** Tracks collections, supplier payments, commission, refunds; runs daily/monthly reports.
5. **Deniz — sub-agency owner (B2B).** Books for own clients at net prices, tracks commission and balance.
6. **Selin — content editor.** Maintains tours, blog, SEO, campaigns.

### A.5 Key product principles (UX contract)
- **Never hide the price.** Every card and date row shows a price (or "from ₺X").
- **Dates are first-class.** Availability and remaining seats are always visible.
- **The booking flow cannot dead-end.** If online pay is unavailable, "bank transfer" and "agency will call me" always exist.
- **Admin is dense, not decorative.** Tables, filters, keyboard-friendly, bulk actions.
- **Mobile-first.** The full reservation flow works one-handed on a phone.
- **Trust signals everywhere.** Cancellation rules, secure-payment badges, real testimonials, clear contact.

### A.6 Success metrics
| Metric | Target |
|--------|--------|
| Reservation completion (start → ref number) | ≥ 55% on desktop, ≥ 40% mobile |
| Time to reserve | < 2 min median |
| Tour detail → reservation start | ≥ 12% |
| Quota oversell incidents | 0 |
| Admin time to enter a phone reservation | < 90 s |
| Organic traffic share after 6 mo | ≥ 50% of sessions |
| Payment-confirmation email delivery | ≥ 99% |

### A.7 Constraints & assumptions
- Base currency **EUR**, displayed/collected **TRY** at a daily snapshot rate stored per reservation.
- Passport/national-ID = special-category personal data under KVKK → encrypted at rest, restricted access, retention policy.
- Inventory is **allotment-based** (fixed quota per departure), not free-sell.
- One legal agency tenant; sub-agencies are sub-accounts, not separate tenants.

### A.8 Release criteria (MVP)
- Public catalog + search + tour detail live and indexed.
- End-to-end reservation producing a unique reference + confirmation email.
- Quota decrement proven race-free under concurrency test.
- Admin can create a tour with dates/quota/prices and manage incoming reservations + payments.
- Legal pages (terms, privacy/KVKK, cancellation) published; consent captured.

---

## B. Full feature list

### B.1 Public website (B2C)
- **Homepage:** hero search (destination, departure date, adults, children, price range), featured tours, popular destinations, campaigns/early-booking, "why choose us," testimonials, WhatsApp/contact CTA, SEO destination cards.
- **Destination listing** (`/turlar`) + per-destination landing pages (`/turlar/misir-turlari`).
- **Tour listing** with filters: destination, date, duration, price, transport type, hotel category, availability, visa required/not, guided/free-time, campaign-only. Sorting: cheapest, newest, most popular, earliest departure, highest rated.
- **Tour detail** (`/tur/{slug}`): title, destination, gallery, summary, day-by-day itinerary, available departure dates, duration, included/excluded services, hotel info, flight/transport info, meeting point, visa/passport notes, cancellation rules, reservation conditions, **price table by date & room type** (adult/child/infant), quota/availability, "Reserve Now," WhatsApp quick contact, similar tours, tour FAQ, tour terms, schema.org markup.
- **Reservation flow** (9 steps, see doc 05) → reference number → confirmation screen + email/SMS/WhatsApp-ready message.
- **Reservation lookup** (by reference + email/phone) — no login required.
- **Content/legal:** About, Contact (form + map + WhatsApp), FAQ, Blog/travel guide, Terms, Privacy/KVKK, Cancellation & refund policy.
- **Trust/marketing:** testimonials, campaign banners, newsletter signup, currency display.

### B.2 Customer account area
Register/login, view reservations + statuses, upload passport/documents, see payment status & balance due, download voucher/invoice, message the agency, request cancellation/change, save favorite tours, manage profile + KVKK consents.

### B.3 Admin / back-office
- **Dashboard:** total/pending/confirmed reservations, revenue, outstanding payments, upcoming departures, low-quota alerts, cancellations, recent customer messages.
- **Tour management:** destination, title, slug, description, itinerary (day-by-day), images, duration, included/excluded, departure dates, quotas, base price, currency, room types, child pricing, optional extras, campaign discount, supplier info, visibility (draft/published/hidden), SEO title/description, FAQ, per-tour terms.
- **Departure/date management:** start/end date, quota, remaining seats, price, currency, hotel allocation, flight/transport notes, status (active/full/cancelled/closed), early-booking price, last-minute price, supplier confirmation status.
- **Reservation management:** list + filter (destination/date/status/customer/payment), detail, status update (state machine), internal notes, staff assignment, payment records, document upload, voucher + invoice/proforma generation, send confirmation email, export, cancel, refund tracking, full passenger list.
- **Operations module (per departure):** passenger list, rooming list, transfer list, guide list, hotel allocation list, supplier confirmation list, passport list, payment checklist, emergency-contact list — Excel/PDF export.
- **Accounting module:** payments, unpaid reservations, supplier payments, agency commission, refunds, currency, revenue reports, daily/monthly sales reports, payment methods (card/transfer/cash/agency-credit/partial).
- **B2B sub-agency module:** partner login, B2B prices, create reservations for their customers, track own reservations, commission, pay by card or agency balance, download vouchers, scoped visibility.
- **Content:** blog posts, FAQs, campaigns, testimonials, legal pages, settings.
- **System:** users & roles (RBAC), audit logs, admin activity logs, notification templates, integration settings.

### B.4 Cross-cutting
Search & filtering engine, pricing engine, quota engine, notification engine (email-first, WhatsApp-ready templates), PDF/Excel generation, audit logging, RBAC, rate limiting, KVKK consent & data-retention, multi-language scaffolding (TR now; EN/RU later).
