# HANDOFF — Tur Acente platform

> **Audience:** the next LLM/engineer taking over this project cold.
> **Goal:** understand the project, run it, and continue safely **without rediscovering everything**. Read §0–§3 before touching anything. When this doc and `prisma/schema.prisma` disagree with anything else, **they win.**

---

## 0. Read this first (the things that will bite you)

1. **Where it lives:** `/Users/bogac/Claude/tur-acente`. It **is now a git repo**, pushed to **private** GitHub `github.com/bbm0r/tur-acente` (branch `main`, `gh` CLI account `bbm0r`). `.env` is gitignored — **never commit it**; `.env.example` is the template.
2. **Runs on port `3100`, NOT 3000.** Port **3000 is the user's other app (ATPL Companion) — never kill it.**
3. **PostgreSQL 16 (Homebrew) must start with a locale set**, or it dies with *"postmaster became multithreaded."* Exact command in §3.
4. **Migrations are baselined** (`prisma/migrations/0_init`). Use **`npm run db:migrate`** for schema changes — **do NOT use `prisma db push`** anymore (drifts from history). **After any schema change, RESTART the dev server** (stale Prisma client → "Unknown argument" 500s). See §13.
5. **Sessions are a signed JWT cookie** (`ta_session`, `jose`). No faking via curl. **Reseed (`npm run db:seed`) recreates users → invalidates logged-in sessions → re-login.**
6. **No payments, no passport data** — both deliberately out (user deprioritized card payments; removed all passport data for KVKK/security). **Do not re-add either without being asked.**
7. **The CMS page builder + the CRM are the user's pride** — built to a "premium" bar this session. Keep that quality; always **typecheck + verify in the browser** before claiming done.
8. **Direct SDKs only — never LangChain/Firebase-style orchestration wrappers** (Prisma is fine; it's a query builder). Turkish-first UI; money always visible; mobile-first.

---

## 1. What this is

A **production-grade tourism-agency platform** ("Acente2-style" tour operator) for a Turkish agency selling **international package tours** to five destinations: **Mısır (Egypt), Rusya Moskova (Russia), İtalya (Italy), Benelüks (Benelux), Yunanistan (Greece)**.

One Next.js monolith, four surfaces:
- **Public B2C site** — browse → reserve → pay-by-transfer/agency → confirmation.
- **Customer dashboard** (`/hesabim`) — register/login, reservations, favorites, profile.
- **Admin back-office** (`/admin`) — reservations, operations, tours, **CMS page builder**, media, menus, **forms**, and a full **CRM suite** (leads, pipeline, contacts, tasks, marketing, reports).
- **B2B sub-agency portal** — *designed in the blueprint, NOT built.*

UI is **Turkish-first**; code/docs English. Full written blueprint in `docs/` (§15) + this living handoff + `DEPLOY.md`.

---

## 2. Status at a glance

| Area | State |
|------|-------|
| Public catalog (home, listings, destination, tour detail, search/filter) | ✅ built & verified |
| Reservation engine (9-step wizard, live server pricing incl. early-bird, **race-safe quota**, `TA-XXXXXX` refs) | ✅ |
| Guest reservation lookup · Customer dashboard (register/login, my reservations, favorites ♥, profile, **claim-by-email**) | ✅ |
| Admin: dashboard · reservations+detail (status machine, payment ledger, notes, assign) · operations + CSV · tours CRUD · settings | ✅ |
| **CMS page builder** — 28 block types, drag-drop, **true block nesting** (columns/section), per-block **İçerik/Stil** tabs, **WYSIWYG** rich-text, **HTML block**, **categorized+searchable inserter**, **version history + restore**, **live preview (draft autosave, sticky pane)**, media library, menu builder, editable legal pages, public catch-all | ✅ |
| **Forms-builder** — admin form designer + submissions inbox; public `form` block → submission → CRM lead | ✅ |
| **Premium CRM suite** — leads workflow → interactive drag-drop pipeline → contacts 360° → tasks → segments & email campaigns → analytics dashboard | ✅ |
| Auth (signed JWT, login throttle, realm-aware) · transactional email (Resend **or dev-console fallback**) | ✅ |
| **Ship-readiness** — git+pushed, Prisma migration baselined, env base-URL, S3/R2-ready uploads, `.env.example`, **prod `next build` passes** | ✅ |
| **Online card payment** | ❌ deprioritized by user (checkout = bank transfer / "agency will contact me") |
| **Passport data** | ❌ removed on purpose (no field, no storage, columns dropped) |
| Voucher/proforma PDFs · accounting module · B2B portal · message-the-agency · staging deploy/backups/tests | ❌ not built (§11) |

**`npx tsc --noEmit` = 0 errors and `npm run build` passes. Keep it that way.**

---

## 3. How to run it locally (exact)

```bash
# 1) Start PostgreSQL 16 — THE LOCALE FLAGS ARE MANDATORY on this Mac
PG=/opt/homebrew/opt/postgresql@16/bin
LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 "$PG/pg_ctl" -D /opt/homebrew/var/postgresql@16 -l /tmp/pg.log -w start
# (DB "turacente" + role "bogac" already exist. Check: "$PG/psql -d turacente -c '\dt'")

# 2) Install + apply migrations + seed (from the project dir)
cd /Users/bogac/Claude/tur-acente
npm install
npx prisma migrate deploy   # applies migrations (was `db push` — NOW migrations, see §0/§6)
npm run db:seed             # idempotent: wipes + reinserts demo data (re-login after!)

# 3) Run the dev server ON PORT 3100 (3000 is taken by another app)
npm run dev -- -p 3100      # open http://localhost:3100
```

- **`.env`** exists (gitignored): `DATABASE_URL="postgresql://bogac@localhost:5432/turacente"`, `AUTH_SECRET`, `RESEND_API_KEY=""` (empty → emails log to console), `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_WHATSAPP`, `ADMIN_EMAIL/PASSWORD`. Optional prod: `S3_*` (uploads). See `.env.example` for all.
- **Claude Preview MCP** drives the browser. Config `/Users/bogac/Claude/.claude/launch.json` runs `npm --prefix tur-acente run dev -- -p 3100`. Use `preview_start` (name `tur-acente`) → `preview_eval` / `preview_screenshot`. **Restart it after schema changes** (§13).

---

## 4. Tech stack (pinned for reasons)

- **Next.js `15.1.6`** (App Router, React 19) · **TypeScript strict**.
- **Tailwind v3.4** (classic `tailwind.config.ts` + `globals.css` `@tailwind`; tokens: `brand` teal, `accent` amber, `ink` slate; reusable `.btn-primary/-ghost/-accent`, `.card`, `.input`, `.label`, `.chip`, `.container-page`, `.rounded-xl2`).
- **PostgreSQL 16** + **Prisma `^6.19`** — **PIN v6** (v7 moves datasource url to `prisma.config.ts` and breaks the schema header).
- **Auth:** custom **signed JWT sessions via `jose`** (no NextAuth) + `bcryptjs`.
- **Email:** `resend` (console fallback when no key). **Uploads:** `@aws-sdk/client-s3` (S3/R2; local fallback).
- **Validation:** `zod`. **Icons:** `lucide-react`. **Utils:** `clsx`+`tailwind-merge` (`cn()`).
- **60 Prisma models / 41 enums / 60 tables.** ~130 TS/TSX source files (160 tracked files incl. docs).

---

## 5. Architecture & mental model

**One monolith. Reads = server components calling `lib/` directly. Mutations = server actions (`"use server"`) that auth-check, validate, mutate, `revalidatePath`.** Business logic lives in `lib/` (mostly `server-only`), never in components.

**Route groups (`()` folders don't appear in the URL):**
- `app/(public)/…` → B2C site (`Header`/`Footer`/`WhatsAppFab`). `app/(public)/[...slug]` → **CMS catch-all** (renders published `pages.blocks` via `BlockRenderer`; lowest priority so real routes win). `app/(public)/formlar/actions.ts` → public `submitFormAction` (no route, just the action).
- `app/admin/(panel)/…` → staff back-office; `layout.tsx` → `getStaffUser()` else redirect `/admin/giris`; wrapped in `<AdminShell>` (sidebar). Areas: `rezervasyonlar`, `operasyon`, `turlar`, `sayfalar`, `medya`, `menuler`, `formlar`, `crm`, `musteriler`, `gorevler`, `pazarlama`, `raporlar`, `ayarlar`.
- `app/admin/giris` → staff login (outside gated group).
- `app/(account)/hesabim/…` → customer dashboard; `getCustomerUser()` else `/hesap/giris`. `app/hesap/{giris,kayit}` → customer auth.
- `app/onizle/[id]` → CMS **preview** (staff-gated; renders `draftBlocks ?? blocks`, or `?rev=<id>` for a specific revision).

**Auth realms** (`lib/auth.ts`): one signed cookie `ta_session` = `{ userId, realm }`, realm ∈ `STAFF|CUSTOMER|B2B`. `getStaffUser()`/`getCustomerUser()` check realm + `isActive`. One browser = staff **or** customer at a time. Staff = `user.realm === "STAFF" && isActive`.

---

## 6. Conventions & invariants — DON'T violate these

- **Money = integer MINOR units** + ISO currency, never floats. Tour prices **EUR**; each reservation **snapshots EUR→TRY** (`lib/money.ts`: `DEMO_EUR_TRY=35`, `eurToTryMinor`, `formatMoney`). Reservations display TRY; CRM opportunity values are EUR.
- **Quota is oversell-proof.** `lib/reservations.ts` `createReservation` uses a **conditional raw SQL UPDATE** in a txn: `UPDATE "tour_dates" SET "seatsSold"="seatsSold"+n WHERE id=… AND ("quota"-"seatsSold"-"seatsHeld")>=n` → 0 rows ⇒ `SOLD_OUT`. **Never replace with read-then-write.**
- **Reservation status machine** `lib/statusMachine.ts` (8 states, enforced transitions, cancel releases seats); changes via `lib/reservationOps.ts` (`changeStatus`/`recordPayment`/`addInternalNote`/`assignAgent`), all audited.
- **`server-only`** modules can't be imported into client components — cross via server actions. **Shared client/server types** (e.g. `Block`, `FormField`, `FormSettings`, `BlockStyle`) live in `lib/blocks.ts` (NO server-only) so client components can import them.
- **Prisma raw SQL: double-quote camelCase columns** (`"seatsSold"`); table names snake_case (`@@map`). **Prisma enums must be multi-line** (one-line `enum X { A B }` is invalid → cascades fake errors).
- **Migrations:** baselined → use `npm run db:migrate` (`prisma migrate dev`); prod `prisma migrate deploy`. **Not `db push`.**
- **Audit:** staff mutations write `audit_logs` (`lib/audit.ts`). **Slugs** Turkish+SEO (`misir-sharm-el-sheikh-5-gece`).
- When you delete a route, `rm -rf .next/types` before `tsc`.

---

## 7. The database

Spine: `Destinations → Tours → TourDates(+TourPrices) → Reservation(→Passengers,Extras) → Payments`. A tour has dated departures; each date has a price grid (date×room×pax) + `seatsSold/quota`. Everything else hangs off the spine.

- Plain-language: `docs/DATABASE-EXPLAINED.md`. Technical: `docs/03-database-schema.md` + **`prisma/schema.prisma`** (source of truth).
- Groups: **auth** (`users/roles/permissions`), **crm** (`customers`(+lifecycle/owner)/`leads`/`crm_pipelines`/`crm_stages`/`crm_opportunities`/`crm_activities`/`crm_tags`/`customer_tags`/`crm_segments`/`crm_segment_members`/`email_campaigns`/`email_campaign_recipients`), **catalog** (`destinations/tours/tour_images/tour_itinerary_days/faqs/campaigns`), **inventory** (`tour_dates/tour_prices/room_types/optional_extras`), **booking** (`reservations/reservation_passengers/reservation_extras/seat_holds`), **money** (`payments/refunds/commissions`), **supply** (`suppliers/hotels/transports`), **b2b** (`agencies/agency_users`), **content** (`pages`(+`draftBlocks`)/`page_revisions`/`content_blocks`/`menus/menu_items`/`media`/`redirects`/`forms`/`form_submissions`/`blog_posts`), **system** (`settings/notifications/audit_logs`/`messages`).
- **Passport columns dropped.** `pages.draftBlocks Json?` = live-preview working copy (§9). The CRM tables were always enterprise-grade; this session built the UI on top.

---

## 8. Directory map (annotated)

**`lib/` (domain, mostly `server-only`):** `db.ts` (Prisma singleton) · `auth.ts` (sessions/login/register staff+customer) · `money.ts` · `utils.ts` (`cn`, `formatDateTr`/`formatDateTimeTr`/`formatDateRangeTr`) · `slug.ts` · `theme.ts` · `labels.ts` (TR enum labels: `reservationStatusLabel/Color`, `lifecycleLabel`, …) · `catalog.ts` · `pricing.ts` (`quote()`) · `reservations.ts` · `reservationOps.ts` · `statusMachine.ts` · `operations.ts` · `account.ts` · `audit.ts` · `email.ts` (`sendEmail`/`emailLayout`) · `notify.ts` · **`blocks.ts`** (block registry `BLOCK_DEFS`/`BLOCK_DEF`, `BLOCK_GROUPS`, `STYLE_FIELDS`, `Block`/`FieldDef`/`BlockStyle`/`FormField`/`FormSettings` types, `blockSlots`/`isContainerType`, `parsePairs`) · **`blockTree.ts`** (pure nested-block tree ops by id) · `menu.ts` · **`forms.ts`** (forms domain) · **`crm.ts`** (entire CRM domain) · **`storage.ts`** (`putImage` → S3/R2 or local).

**`components/`:**
- `public/*` — Header, Footer, TourCard(+♥), HeroSearch, ReservationView, StaticPage, DestinationCard, Stars, ContactForm, WhatsAppFab, **DynamicForm** (renders a form block).
- `booking/BookingWizard.tsx` — 9-step wizard (`data-testid`: `wizard-next/-submit`, `pay-bank`, `kvkk`).
- `admin/AdminShell.tsx` — sidebar (13 nav items). `admin/reservation/*`, `admin/tour/*`.
- `admin/cms/*` — **PageBuilder** (the big one: recursive `renderNode`, İçerik/Stil tabs, categorized inserter, live preview, addTarget for nesting), **RichTextEditor**, **RevisionHistory**, **DeletePageButton**, MediaPicker/Uploader/Library, MenuBuilder, NewPageForm, **FormBuilder**.
- `admin/crm/*` — **LeadsInbox**, **PipelineBoard**, **OpportunityDrawer**, **CustomerEditor**, **ActivityLogger**, **TaskBoard**, **SegmentForm**, **CampaignComposer**.
- `blocks/BlockRenderer.tsx` — **server, recursive** block→JSX renderer (`BlockShell` applies per-block Stil; dynamic blocks fetch live data; `sanitizeHtml` for staff HTML).
- `account/*` — AccountNav, FavoriteButton, ProfileForm.

**Server actions** live next to their routes: `sayfalar/actions.ts` (pages: save/create/delete/publish/revisions/**autosave**), `formlar/actions.ts`, `crm/actions.ts` (leads+opportunities+activities+tasks), `musteriler/actions.ts`, `pazarlama/actions.ts`, plus `(public)/formlar/actions.ts` (public submit).

---

## 9. Feature detail

**Reservation engine (verified).** Wizard → `getQuoteAction` (live, early-bird aware) → `submitReservationAction` → `createReservation` (txn: conditional quota decrement, customer find-or-create, passengers, extras, `RES_NEW` notification) → `TA-XXXXXX` + confirmation page + email. Proven: valid booking, **oversell→SOLD_OUT**, atomic decrement, early-bird.

**Admin reservation ops / operations / tours (verified).** Reservation detail: status state-machine, **payment recording** (recomputes paid/balance, auto-advances `WAITING_PAYMENT→PAYMENT_RECEIVED`, emails customer), notes, assignment, all audited. `/admin/operasyon/[dateId]`: pax/rooming/payment lists + CSV (UTF-8 BOM); **no passport**. `/admin/turlar`: TourForm + DateManager (auto price grids) + PublishButton.

**CMS page builder (verified — premium).** Blocks are a JSON array on `pages.blocks`; `lib/blocks.ts` is the registry; `BlockRenderer` (server, recursive) renders them. **28 block types.** Highlights:
- **Per-block Stil tab** (`BlockStyle`/`STYLE_FIELDS`, applied by `BlockShell`): bg color/image+overlay, text color, padding, align, anchor `#id`, hide-mobile/desktop. Editor splits **İçerik | Stil** tabs (resets to İçerik on block switch via `selectBlock`).
- **Field-control types:** text/textarea/number/select/destination/**form**/image/images/color/toggle/align/range/**richtext** (WYSIWYG, `RichTextEditor.tsx` → HTML)/**code**. Staff HTML (richText-as-HTML + `html` block) rendered via `dangerouslySetInnerHTML` after `sanitizeHtml()` (strips `<script>`, `on*=`, `javascript:`) — OK since authoring is staff-gated.
- **Blocks:** hero (bg photo+overlay+height+align), heading (H1–H4+align+color), richText, html, image (align/width/rounded/link), gallery, video, button (size/full-width/new-tab), buttonGroup, mediaText, **columns** & **section** (containers — see nesting), quote, accordion, faq, iconList, banner (info/success/warning/danger), map (Google Maps `?q=&output=embed`, no key), stats, features, cta, testimonials, divider, spacer, **form**, **dynamic**: tourGrid/destinationGrid/searchBar.
- **True block nesting:** `Block.children?: Record<string, Block[]>` (named slots). `columns` (slots `col-0…` from `count`) + `section` (slot `main`). `BlockRenderer` recurses (`depth`, `MAX_DEPTH=4`; columns children wrapped in a class neutralising `.container-page` gutter; legacy `col1/col2/col3` fallback). Editor uses a recursive `renderNode`; per-slot **"Blok ekle"** retargets the single inserter (`addTarget`). Tree edits are pure id-keyed helpers in **`lib/blockTree.ts`**. Reorder: top-level drag-drop + up/down arrows at all depths.
- **Categorized inserter:** grouped Düzen/İçerik/Medya/Dinamik (`BLOCK_GROUPS`, "Diğer" catch-all) + live search.
- **Live preview:** `pages.draftBlocks` holds the working copy. `PageBuilder.mutate()` debounce-fires `autosavePageAction` (~700ms, writes **only draftBlocks**, no revision) → reloads the preview iframe in place. `/onizle/[id]` + the editor load `draftBlocks ?? blocks`; **public renders published `blocks` only** (drafts never leak); **Kaydet** (`savePageAction`) promotes draft→published + writes a revision. Preview pane is **sticky + viewport-height** so it follows you.
- **Version history + restore** (`RevisionHistory.tsx`): "Geçmiş" drawer lists saved versions; **Önizle** → `/onizle/[id]?rev=<id>`; **"Bu sürümü yükle"** loads into editor (review → Kaydet, captured as a new revision). Revisions snapshot title+blocks only.
- **Media** (`/admin/medya`): uploads via `lib/storage.ts` (S3/R2 if `S3_*` set, else local `public/uploads`) → `media` table; `MediaPicker` feeds image/gallery fields. **Menu builder** (`/admin/menuler`): DB-driven header/footer. **Legal pages** are block-based, `isSystem` (slug locked, **no Sil**). **Page delete:** Sayfalar list has a **Sil** button (`DeletePageButton.tsx`) → `deletePageAction` (cascades revisions); hidden for `isSystem`.

**Forms-builder (verified).** `/admin/formlar`: list + create + **FormBuilder** (name/key/active, settings {successMessage, createLead, notify}, repeatable fields: label/type[text·email·tel·textarea·select]/required/options) + delete, and a per-form **submissions inbox** (`[id]/gonderiler`, statuses NEW/READ/ARCHIVED/SPAM, link to created lead). Domain `lib/forms.ts` (`getFormByKey`/`validateSubmission`/`mapLead`). Public **`form` block** → `DynamicForm` → `submitFormAction` (`(public)/formlar/actions.ts`, no-auth): validate → `FormSubmission` → optional `Lead` (channel DIRECT_WEB) → `ADMIN_ALERT` notification. So **form submissions appear in the CRM leads inbox** (with an "İletişim Formu" origin chip).

**Premium CRM suite (verified, Phases 1–6 complete).** Schema was already enterprise-grade; this session built the whole UI + `lib/crm.ts` domain. Sidebar items: **CRM · Müşteriler · Görevler · Pazarlama · Raporlar.**
- **`/admin/crm`** — `LeadsInbox` (status tabs, assign, **"Fırsata dönüştür"** → find/create Customer + OPEN Opportunity + NOTE activity + lead CONVERTED) above an **interactive drag-drop Kanban** (`PipelineBoard`, optimistic; dropping into a won/lost stage closes the opp) with **+ Yeni Fırsat** and a click-through **OpportunityDrawer** (details + activity timeline + log activity + Won/Lost).
- **`/admin/musteriler`** — Contacts 360°: list (search + lifecycle/owner filters) + profile (`CustomerEditor`: edit contact/lifecycle/owner/consent/notes + tags; stats; reservations; opportunities; activity timeline + `ActivityLogger`; favorites; messages).
- **`/admin/gorevler`** — Tasks: all PENDING activities grouped Gecikmiş/Bugün/Yaklaşan/Tarihsiz, scope toggle (Bana atananlar/Tümü), **Tamamla**, **+ Yeni Görev**. The two activity loggers gained an optional **due-date** → dated activity becomes a task here.
- **`/admin/pazarlama`** — Segments & Campaigns: **dynamic segments** (`SegmentForm`: lifecycle+tag+consent filter, live counts) + **email campaigns** (`CampaignComposer`: compose → **Gönder** → `sendCampaign()` resolves segment, emails each via `lib/email`, writes `EmailCampaignRecipient` SENT/FAILED, sets campaign SENT+stats). Segments default **consent-only** (KVKK).
- **`/admin/raporlar`** — read-only analytics (`getCrmDashboard()` via Prisma groupBy/count/_sum): stat cards, pipeline value by stage, conversion funnel, win/loss, lifecycle + leads breakdowns, agent-performance table (CSS bars, no chart lib).
- CRM actions: `crm/actions.ts` (lead status/assign/convert · opportunity move/create/getOpportunity/logActivity/setStatus · completeActivity/createTask), `musteriler/actions.ts`, `pazarlama/actions.ts`. **No delete-opportunity UI** (use Won/Lost).

**Customer dashboard (verified).** `registerCustomer` links by email (claims guest bookings). My-reservations, detail (reuses `ReservationView`), favorites ♥, profile (email locked, KVKK consent).

**Auth + email + uploads (verified).** JWT sessions reject tampered/old/forged cookies; login + throttle work. Email via Resend or dev-console (no key). Uploads via `lib/storage.ts` (verified local; S3/R2 path is env-gated, untested without creds).

---

## 10. Key decisions & user preferences (carry forward)

- **No online payments** (deprioritized) — don't assume payment is next. **Zero passport data** (removed for KVKK) — never re-add a passport field/upload; no customer ID/document uploads either.
- **Direct SDKs, no orchestration wrappers.** **Turkish-first UI**, money always visible, mobile-first.
- The user **steers feature-by-feature**, loves **deep "premium" builds** (gave the CMS builder and CRM the elite treatment), and wants **verified, working increments** — **always `tsc` + browser-verify before "done."**
- Workflow that worked: build → `rm -rf .next/types && npx tsc --noEmit` → verify in the browser via Preview MCP (or a temp `app/api/devtest/*` route, then delete it) → update HANDOFF + memory.

---

## 11. What's next (pick with the user)

The CMS builder, forms, and the entire CRM are done. Remaining, roughly in value order:
1. **Finish ship/deploy** (`DEPLOY.md`, §16): provision managed Postgres, deploy to Vercel + `prisma migrate deploy` release step, set prod env (`AUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`+`EMAIL_FROM`, `S3_*`), enable DB backups. **Needs the user's accounts.**
2. **Message-the-agency** from a reservation (`messages` table ready) — the customer area's last small gap.
3. **Voucher / proforma PDFs** — add `@react-pdf/renderer`; needed to service confirmed bookings.
4. **Accounting module** — revenue, outstanding, supplier payments, commissions, refunds (data already in `payments/commissions/refunds`).
5. **B2B sub-agency portal** — net pricing, agency balance/commission, scoped reservations, vouchers (schema + `B2B` realm exist; big build).
6. **Quality:** integration tests around the booking/quota/payment txn; **clear demo CRM data** before launch (see §14).

---

## 12. How to verify your work (the workflow that worked)

1. **`rm -rf .next/types && npx tsc --noEmit`** — 0 errors. **`npm run build`** for a prod-build gate. **Run tsc/build from the project dir** (the shell cwd sometimes resets to the workspace root → a fake "this is not the tsc command" error).
2. **`curl http://localhost:3100`** for public pages. Admin/customer/onizle need a **real JWT session** — log in via Preview MCP.
3. **Browser flows via Preview MCP** (`preview_start` name `tur-acente`, `preview_eval`, `preview_screenshot`). ⚠️ **Flaky:** the page can navigate between eval calls (split navigate + read into separate calls); the **staff session intermittently drops on server-action POST→redirect** (login/GET-nav/client-transition actions are fine) — re-login and re-check the URL; **React-controlled inputs resist scripted fills** — set value via the native setter + dispatch `input`/`change`, or click real buttons.
4. **Exercise `server-only` logic** with a temp **`app/api/devtest/...`** route (NOT `_`-prefixed — underscore folders 404), curl it, **delete it after** (this is how the booking engine, forms pipeline, nesting renderer, etc. were verified).

---

## 13. Gotchas & traps (consolidated)

- Postgres won't start without `LC_ALL`/`LANG` (§3). Port **3000 is another app — use 3100**. **Reseed → re-login**.
- **After `prisma migrate`/`db push`/any schema change, RESTART the dev server** — the running Next process caches the old Prisma client → new columns 500 with "Unknown argument `x`". (Bit us adding `pages.draftBlocks`.)
- Prisma **single-line enums invalid**; raw SQL needs **quoted camelCase columns**; `@db.Decimal` only for `exchangeRate`/`commissionPercent` (rest = Int minor units).
- `app/api/_foo` (underscore) is **excluded from routing** — use non-underscore for temp routes.
- Uploads via **`lib/storage.ts`**: S3/R2 when `S3_*` env set, else local `public/uploads` (ephemeral on serverless — set `S3_*` in prod).
- Email silently "succeeds" via console when `RESEND_API_KEY` empty — check dev-server log / `notifications` table.
- `metadataBase` reads **`NEXT_PUBLIC_BASE_URL`** (fallback `localhost:3100`) — set to the real domain in prod.
- Lingering **demo CRM data** from verification (see §14) — harmless, but clear before launch.

---

## 14. Demo accounts & sample data

- **Staff admin:** `admin@turacente.com` / `admin1234` → `/admin`.
- **B2B:** `deniz@gezgintur.com` / `acente1234` (portal not built).
- **Customer:** `ayse@example.com` / `test1234` — claimed booking `TA-7H2K9M` + 1 favorite. (Seed doesn't create customer logins; survives only until reseed.)
- **Seeded:** 5 destinations, 6 tours, 13 departures, 78 price rows; reservations `TA-7H2K9M`/`TA-3P8Q1R`/`TA-9X4L2D`; CRM pipeline "Satış Hattı" + stages + opportunities + activities; menus; block-based legal pages; `/kampanyalar` demo page; testimonials.
- **Runtime demo data from this session's verification (NOT seeded — a reseed wipes it):** form `iletisim-formu` ("İletişim Formu") + a submission; 3 WON opportunities (incl. "Deneme Fırsatı — Test"); a "VIP" tag on customer "boğaç morkoyun"; task "İtalya turu teklifini hazırla"; segment "CUSTOMER Segmenti"; sent campaign "Yaz Kampanyası 2026".

---

## 15. Docs (`docs/` + root)

Blueprint (design reference, written pre-build): `01-prd.md` · `02-roles-and-journeys.md` · `03-database-schema.md` · `04-api-and-frontend.md` · `05-business-logic.md` · `06-seo-and-security.md` · `07-seed-data.md` · `08-crm.md` · `09-cms-page-builder.md` · `DATABASE-EXPLAINED.md`. Root: `README.md`, `RUNNING.md`, **`DEPLOY.md`** (deploy checklist), `.env.example`.

> Some blueprint docs describe unbuilt (B2B, payments) or since-changed (passport encryption — **removed**) things. **HANDOFF + `prisma/schema.prisma` win on conflict.**

---

## 16. Ship / deploy status

**Done:** git repo + pushed to private `github.com/bbm0r/tur-acente` (`main`); Prisma migration baselined (`prisma/migrations/0_init`); env-driven `metadataBase`; S3/R2-ready uploads (`lib/storage.ts`); `.env.example`; **prod `next build` passes**. **Remaining (need user's accounts):** managed Postgres, Vercel deploy + migrate-deploy step, prod env vars, automated DB backups, integration tests. Full checklist in **`DEPLOY.md`**.

---

*Last updated end of the CRM + ship-readiness session. `tsc` clean, prod build passes, repo pushed. Keep increments small, typecheck + browser-verify, and update this doc + memory as you go. Good luck.*
