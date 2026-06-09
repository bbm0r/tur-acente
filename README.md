# Tur Acente — Tourism Agency Platform (Blueprint)

> Production blueprint for an Acente2-style B2C + B2B tour-operator platform.
> Sells international package tours: **Mısır · Rusya (Moskova) · İtalya · Benelüks · Yunanistan**.
> Docs in English; all user-facing content, slugs, and seed data in Turkish.

This repository currently contains the **architecture blueprint** (outputs A–R) plus an
executable `prisma/schema.prisma`. The running Next.js application is scaffolded from this
schema as the next step.

---

## 📁 Document index

| # | File | Covers (output letters) |
|---|------|--------------------------|
| — | [README.md](README.md) | Tech stack (O), Roadmap (P), MVP vs Full (Q) |
| 01 | [docs/01-prd.md](docs/01-prd.md) | PRD (A), Full feature list (B) |
| 02 | [docs/02-roles-and-journeys.md](docs/02-roles-and-journeys.md) | Roles & permissions (C), User journeys (D), Admin workflows (E) |
| 03 | [docs/03-database-schema.md](docs/03-database-schema.md) | Database schema (F) — all 30+ tables, enums, indexes |
| 04 | [docs/04-api-and-frontend.md](docs/04-api-and-frontend.md) | API routes (G), Frontend page structure (H), Component list (I) |
| 05 | [docs/05-business-logic.md](docs/05-business-logic.md) | Reservation logic (J), Payment logic (K), Admin panel logic (L) |
| 06 | [docs/06-seo-and-security.md](docs/06-seo-and-security.md) | SEO plan (M), Security & KVKK plan (N) |
| 07 | [docs/07-seed-data.md](docs/07-seed-data.md) | Seed/sample data (R) — 5 destinations, real tours |
| 08 | [docs/08-crm.md](docs/08-crm.md) | CRM — contacts, pipeline, activities, segments, campaigns |
| 09 | [docs/09-cms-page-builder.md](docs/09-cms-page-builder.md) | CMS & visual page builder, menus, media library, forms |
| — | [prisma/schema.prisma](prisma/schema.prisma) | Executable schema (50+ models) — validated clean against Prisma 6 |

---

## O. Suggested tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | SSR/ISR for SEO-critical tour pages; server actions for the booking flow; one deployable for B2C + admin + B2B. |
| Language | **TypeScript (strict)** | Type safety end-to-end; Prisma + Zod share types. |
| Styling | **Tailwind CSS** + Radix UI primitives | Mobile-first, fast, accessible. No heavy component lib. |
| DB | **PostgreSQL 16** | Relational integrity is non-negotiable for reservations/quota/accounting. |
| ORM | **Prisma 6.x** | Typed queries, migrations, transactions for quota-decrement safety. Pin v6 — v7 moves the datasource `url` into `prisma.config.ts`. |
| Auth | **Auth.js (NextAuth)** — credentials + email | Sessions, RBAC, separate guards for customer vs staff vs B2B. |
| Validation | **Zod** | One schema reused for form, API, and server action. |
| Files/docs | **S3-compatible** (Cloudflare R2 / AWS S3) | Passport scans, vouchers, invoices — private buckets, signed URLs. |
| Email | **Resend** (transactional) | Confirmation, payment, reminders. Provider-swappable behind an interface. |
| PDF | **@react-pdf/renderer** | Vouchers, proforma invoices, operation lists. |
| Excel | **exceljs** | Pax/rooming/transfer list exports. |
| Payments | **iyzico** (TR) + **Stripe** (intl/B2B) behind a `PaymentProvider` interface | 3D Secure, TRY collection. Pluggable. |
| Background jobs | **BullMQ + Redis** (or Vercel Cron for v1) | Reminders, low-quota alerts, rate snapshots. |
| Hosting | **Vercel** (app) + **Neon/Supabase Postgres** (DB) + **R2** (files) | Fast path to production; portable. |
| Observability | **Sentry** + structured logs | Error + audit visibility. |

**Architecture:** one Next.js monolith, three route groups — `(public)`, `(account)`, `(admin)`, `(b2b)` —
sharing a `lib/` domain layer (`reservations`, `pricing`, `quota`, `payments`, `notifications`).
Business logic lives in server-side domain services, **never** in React components.

---

## P. Development roadmap (step-by-step)

**Phase 0 — Foundations (week 1)**
1. Repo, CI, env config, Prisma migrate, seed script (docs 03 + 07).
2. Auth.js with role guards; layout shells for the 4 route groups.
3. Design tokens, Tailwind config, core UI kit (Button, Input, Card, Badge, Money).

**Phase 1 — Public catalog + reservation engine (weeks 2–4)**
4. Destination + tour listing + tour detail (SSR/ISR, SEO).
5. Search/filter (destination, date, pax, price, duration, hotel cat, campaign).
6. Pricing engine + quota service (transactional decrement).
7. 9-step reservation flow → reference number → confirmation page.
8. Email confirmation + WhatsApp-ready templates. Reservation lookup page.

**Phase 2 — Admin back-office (weeks 5–7)**
9. Tour CRUD (incl. dates, quotas, prices, room types, extras, itinerary, SEO).
10. Reservation management (filter, detail, status machine, notes, assignment).
11. Payment records + status sync; voucher + proforma PDF generation.
12. Dashboard (KPIs, low-quota alerts, upcoming departures).

**Phase 3 — Operations + accounting (weeks 8–9)**
13. Operations lists per departure (pax/rooming/transfer/passport/hotel) + Excel/PDF.
14. Accounting (collections, supplier payments, commission, refunds, reports).
15. Audit logs surfaced in admin.

**Phase 4 — Customer area + B2B (weeks 10–12)**
16. Customer account (reservations, documents, payment status, messages, favorites).
17. B2B sub-agency portal (B2B pricing, book-for-customer, balance/commission, vouchers).
18. Notification rules engine (reminders, missing-doc, low-quota).

**Phase 5 — Content + hardening (week 13+)**
19. Blog/travel-guide CMS, FAQ, legal pages, sitemap, schema.org.
20. Rate limiting, KVKK consent + retention jobs, backups, load test, launch.

---

## Q. MVP vs Full version

| Capability | MVP (launchable) | Full |
|------------|------------------|------|
| Public catalog + search | ✅ | ✅ + saved searches, rating sort |
| Reservation flow | ✅ 9 steps, ref number | ✅ + seat-hold timer, upsells |
| Payment | Bank transfer + "agency will contact" | + online card (iyzico/Stripe), partial payments, agency credit |
| Customer area | Lookup by ref + email | Full account, doc upload, favorites, messaging |
| Admin tours | ✅ CRUD, dates, quota, price | ✅ + campaigns, supplier allocation, bulk date tools |
| Admin reservations | ✅ list, detail, status, notes | + assignment, voucher/proforma, exports |
| Operations | Pax list (PDF) | Full ops suite (rooming/transfer/passport/hotel) + Excel |
| Accounting | Manual payment records, basic revenue | Full ledger, supplier payments, commission, refund tracking, reports |
| B2B portal | ❌ (phase 4) | ✅ pricing tier, balance, commission, vouchers |
| Notifications | Email (new res + confirmation) | Email + SMS + WhatsApp API, full rules engine |
| Content/SEO | Tour/destination SEO + sitemap | + blog CMS, schema markup, multi-language (EN/RU) |
| CRM | Leads + contacts + notes | Full pipeline, activities/tasks, segments, email/WhatsApp campaigns |
| CMS / page builder | Legal/static pages, blog | Visual block builder, menus, media library, forms→CRM, redirects |

**MVP = Phases 0–2** (catalog + reservation + core admin). Everything else layers on without schema changes — the database (doc 03) is designed full-spec from day one so no migration pain later.

---

## Conventions

- **Slugs** are Turkish & SEO-shaped: `misir-turlari`, `misir-sharm-el-sheikh-5-gece`.
- **Money** stored as integer minor units + ISO currency code; never floats.
- **All tables** carry `id` (cuid), `createdAt`, `updatedAt`; soft-delete via `deletedAt` where it matters.
- **Enums** are explicit (see doc 03); status transitions are validated server-side (doc 05).
- **Every mutating staff/B2B action** writes an `audit_logs` row.
