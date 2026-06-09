# Running the app locally

The app is a Next.js 15 + Prisma + PostgreSQL monolith. Below is everything needed to bring it
up from a cold machine.

## Prerequisites
- Node 20+ (built on Node 24)
- PostgreSQL 16 (`brew install postgresql@16`)

## 1. Start PostgreSQL
> ⚠️ macOS quirk: Postgres 16 must be started with a locale set, otherwise it fails with
> *"postmaster became multithreaded during startup"*.

```bash
PG=/opt/homebrew/opt/postgresql@16/bin
LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 "$PG/pg_ctl" -D /opt/homebrew/var/postgresql@16 -l /tmp/pg.log -w start
"$PG/createdb" turacente   # only the first time
```

`.env` already points at it:
```
DATABASE_URL="postgresql://bogac@localhost:5432/turacente"
```

## 2. Install + set up the database
```bash
npm install
npx prisma db push     # creates all 60 tables
npm run db:seed        # 5 destinations, 6 tours, 13 departures, demo reservations, admin + B2B users
```
The seed is idempotent — safe to re-run; it wipes and rebuilds the demo data.

## 3. Run
```bash
npm run dev -- -p 3100   # 3000 is used by another local app (ATPL Companion)
```
Open **http://localhost:3100**.

## Demo accounts
| Role | URL | Login |
|------|-----|-------|
| Yönetici (admin) | `/admin` | `admin@turacente.com` / `admin1234` |
| B2B acente | (panel pending) | `deniz@gezgintur.com` / `acente1234` |

## What's built (MVP — Phases 0–2)
- **Public site:** homepage (hero search, featured tours, destinations, campaigns, testimonials),
  `/turlar` listing + filters, destination landing pages, full tour detail (itinerary, price table,
  departures), **9-step reservation wizard** with live server-side pricing, confirmation page,
  reservation lookup, contact (→ CRM lead), about + legal pages, sitemap/robots.
- **Reservation engine:** server-side quote (date × room × pax × early-bird), race-safe quota
  decrement (conditional UPDATE — oversell-proof), reference numbers, customer + passenger creation.
- **Admin panel:** cookie auth + role gate, dashboard (live KPIs, low-quota alerts, upcoming
  departures), reservations list (filter/search), tours list, **CRM pipeline board** + leads inbox,
  settings.

## What's next (from the blueprint)
- Online card payment (iyzico/Stripe behind the `PaymentProvider` interface)
- Admin tour create/edit forms + price-grid editor; reservation detail + status machine + voucher/proforma PDFs
- Operations lists (rooming/transfer/passport) + Excel export; accounting module
- Customer account area; B2B sub-agency portal
- CMS visual page builder (doc 09); Auth.js migration; email sending (Resend)
- Passport-at-rest encryption; full RBAC enforcement

See [`docs/`](docs/) for the complete blueprint these map to.
