# HANDOFF — Tur Acente platform

> **Audience:** the next LLM/engineer taking over this project cold.
> **Goal of this doc:** let you understand the project, run it, and continue safely **without rediscovering everything**. Read §0–§3 before touching anything.

---

## 0. Read this first (the things that will bite you)

1. **Where it lives:** `/Users/bogac/Claude/tur-acente`. It is **NOT a git repo** (no history). Consider `git init` early.
2. **It runs on port `3100`, NOT 3000.** Port **3000 is the user's *other* app (ATPL Companion) — never kill it.**
3. **PostgreSQL 16 (Homebrew) must be started with a locale set**, or it dies with *"postmaster became multithreaded."* Exact command in §3.
4. **The admin/customer session is a signed JWT cookie** (`ta_session`). The old `curl -b "ta_admin=<id>"` trick is **dead** — you can't fake a session.
5. **Re-running the seed (`npm run db:seed`) recreates all users with new IDs**, which **invalidates any logged-in browser session** → you must re-login after every reseed.
6. **No payments, no passport data.** The user explicitly **deprioritized online card payments** and **removed all passport data for security**. Do not re-add either without being asked.
7. **The CMS page builder is the user's #1 priority feature.** Treat it as the crown jewel.
8. The user dislikes orchestration wrappers — **direct SDKs only, never LangChain/Firebase-style layers** (Prisma is fine; it's a query builder).

---

## 1. What this is

A **production-grade tourism-agency platform** (an "Acente2-style" tour operator system) for a Turkish agency selling **international package tours** to five destinations: **Mısır (Egypt), Rusya Moskova (Russia), İtalya (Italy), Benelüks (Benelux), Yunanistan (Greece)**.

It is one Next.js monolith containing four surfaces:
- **Public B2C website** (browse → reserve → pay-by-transfer/agency → confirmation).
- **Customer dashboard** (`/hesabim`): register/login, my reservations, favorites, profile.
- **Admin back-office** (`/admin`): reservations, operations, tours, CRM, **CMS page builder**, media, menus, settings.
- **B2B sub-agency portal** — *designed in the blueprint, NOT built yet.*

UI language is **Turkish-first**. Docs/code are English. There is a full written blueprint in `docs/` (see §15) plus this living handoff.

---

## 2. Status at a glance

| Area | State |
|------|-------|
| Public catalog (home, listings, destination, tour detail, search/filter) | ✅ built & verified |
| Reservation engine (9-step wizard, live server pricing incl. early-bird, **race-safe quota**, reference numbers) | ✅ built & verified |
| Guest reservation lookup | ✅ |
| Customer dashboard (register/login, my reservations, favorites ♥, profile, **claim-bookings-by-email**) | ✅ built & verified |
| Admin: dashboard / reservations+detail (status machine, payment ledger, notes, assign) / operations + CSV / tours CRUD / settings | ✅ built & verified |
| **Premium CRM suite** (leads workflow → interactive drag-drop pipeline → contacts 360° → tasks → segments & email campaigns → analytics dashboard) — `/admin/crm` · `/admin/musteriler` · `/admin/gorevler` · `/admin/pazarlama` · `/admin/raporlar` | ✅ built & verified |
| **CMS page builder** (28 block types incl. dynamic, drag-drop, media library + uploads, live preview, public catch-all render, editable legal pages, **version history + restore**, **forms-builder**, **per-block Stil system + WYSIWYG + HTML block**, **true block nesting (columns/section containers)**, **live preview (draft autosave)**) | ✅ built & verified |
| **Menu builder** (DB-driven header/footer) | ✅ built & verified |
| Auth hardening (signed JWT sessions, login throttle, realm-aware) | ✅ built & verified |
| Transactional email (Resend **or dev-console fallback**) — confirmation + payment emails | ✅ built & verified (dev transport) |
| **Online card payment** | ❌ **deprioritized by user.** Checkout = bank transfer / "agency will contact me" only. |
| **Passport data** | ❌ **removed entirely on purpose** (security). No field, no storage, columns dropped. |
| Vouchers/proforma PDFs · accounting reports · B2B portal · reusable/global blocks · columns-layout · deploy hardening | ❌ not built (roadmap §11) |

**`npx tsc --noEmit` is currently 0 errors.** Keep it that way.

---

## 3. How to run it locally (exact)

```bash
# 1) Start PostgreSQL 16 — THE LOCALE FLAGS ARE MANDATORY on this Mac
PG=/opt/homebrew/opt/postgresql@16/bin
LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8 "$PG/pg_ctl" -D /opt/homebrew/var/postgresql@16 -l /tmp/pg.log -w start
# (DB "turacente" + role "bogac" already exist. To check: "$PG/psql -d turacente -c '\dt'")

# 2) Install + sync schema + seed   (from the project dir)
cd /Users/bogac/Claude/tur-acente
npm install
npx prisma db push        # we use db push, NOT migrations yet (see §6)
npm run db:seed           # idempotent: wipes + reinserts demo data

# 3) Run the dev server ON PORT 3100 (3000 is taken by another app)
npm run dev -- -p 3100
# open http://localhost:3100
```

- **`.env`** already exists with: `DATABASE_URL="postgresql://bogac@localhost:5432/turacente"`, `AUTH_SECRET`, `RESEND_API_KEY=""` (empty → emails log to console), `EMAIL_FROM`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_WHATSAPP`, `ADMIN_EMAIL/PASSWORD`.
- **Claude Preview MCP** is how the previous session drove the browser. Config: `/Users/bogac/Claude/.claude/launch.json` (workspace root — that's where the MCP looks) runs `npm --prefix tur-acente run dev -- -p 3100`. Use `preview_start` (name `tur-acente`) → `preview_screenshot` / `preview_eval`.
- After `npm run db:seed`, **re-login** in any browser tab (session IDs change).

---

## 4. Tech stack (pinned for reasons)

- **Next.js `15.1.6`** (App Router, React 19) · **TypeScript strict**.
- **Tailwind CSS v3.4** (classic config — `tailwind.config.ts`, `globals.css` with `@tailwind` directives; design tokens: `brand` teal, `accent` amber, `ink` slate; reusable `.btn`, `.card`, `.input`, `.chip` classes).
- **PostgreSQL 16** + **Prisma `^6.19`** — **PIN v6.** Prisma 7 moved the datasource `url` into a `prisma.config.ts` and will break the current schema header.
- **Auth:** custom **signed JWT sessions via `jose`** (no NextAuth) + `bcryptjs`.
- **Email:** `resend` (with a console fallback when no API key).
- **Validation:** `zod`. **Icons:** `lucide-react`. **Utils:** `clsx` + `tailwind-merge` (`cn()`).
- Counts: **60 Prisma models / 41 enums / 60 DB tables / 103 source files.**

---

## 5. Architecture & mental model

**One monolith. Reads = server components calling the `lib/` domain layer directly. Mutations = server actions (`"use server"`) that validate with Zod, enforce auth, and `revalidatePath`.** Business logic lives in `lib/`, never in components.

**Route groups (folders in `()` don't appear in the URL):**
- `app/(public)/…` → the B2C site. Has `Header`/`Footer`/`WhatsAppFab` layout.
- `app/(public)/[...slug]/page.tsx` → **CMS catch-all**: renders any published `pages` row via `BlockRenderer`. Lowest priority, so real routes win.
- `app/admin/(panel)/…` → staff back-office. `layout.tsx` calls `getStaffUser()` → redirect to `/admin/giris` if not staff. Wrapped in `<AdminShell>` (sidebar).
- `app/admin/giris` → staff login (outside the gated group).
- `app/(account)/hesabim/…` → customer dashboard. `layout.tsx` calls `getCustomerUser()` → redirect to `/hesap/giris`.
- `app/hesap/giris` + `app/hesap/kayit` → customer auth (outside the gated group).
- `app/onizle/[id]` → CMS draft **preview** (staff-gated, renders blocks with site chrome).

**Auth realms** (`lib/auth.ts`): one signed cookie `ta_session` carries `{ userId, realm }` where realm ∈ `STAFF | CUSTOMER | B2B`. `getStaffUser()` and `getCustomerUser()` each check the realm. Same cookie, so one browser is either staff **or** customer at a time (fine).

---

## 6. Conventions & invariants — DON'T violate these

- **Money is integer MINOR units** (kuruş/cents) everywhere + an ISO currency. Never floats. Tour prices are **EUR**; each reservation **snapshots an EUR→TRY rate** (`lib/money.ts` `DEMO_EUR_TRY = 35`, `eurToTryMinor`, `formatMoney`). Display is TRY.
- **Quota is oversell-proof.** `lib/reservations.ts` `createReservation` decrements seats with a **conditional raw SQL UPDATE** inside a transaction:
  `UPDATE "tour_dates" SET "seatsSold"="seatsSold"+n WHERE id=… AND ("quota"-"seatsSold"-"seatsHeld")>=n` → 0 rows ⇒ `SOLD_OUT`. **Never replace this with a read-then-write.**
- **Reservation status machine** = `lib/statusMachine.ts` (8 states, allowed transitions enforced; cancel releases seats). Status changes go through `lib/reservationOps.ts` (`changeStatus`, `recordPayment` with ledger sync + auto-advance, `addInternalNote`, `assignAgent`) — all audited.
- **`server-only`** modules (most of `lib/`) cannot be imported into client components. Cross the boundary with **server actions**.
- **Prisma raw SQL must double-quote camelCase columns** (`"seatsSold"`), because columns are created case-sensitively. Table names are snake_case (`@@map`).
- **Prisma enums must be multi-line.** `enum X { A B C }` on one line is INVALID and cascades into dozens of fake "unknown type" errors. (This bit us hard once.)
- **Audit:** staff mutations write `audit_logs` (`lib/audit.ts`).
- **Slugs** are Turkish + SEO-shaped (`misir-turlari`, `misir-sharm-el-sheikh-5-gece`).
- **Migrations are now baselined** (`prisma/migrations/0_init`, marked applied). Use **`npm run db:migrate`** (`prisma migrate dev`) for schema changes from now on — do **NOT** go back to `prisma db push` (it would drift from the migration history). Prod applies them with `prisma migrate deploy`.
- When you delete a route, `rm -rf .next/types` before `tsc` (stale generated stubs linger).

---

## 7. The database

Mental model: linked spreadsheets. The **spine** is
`Destinations → Tours → TourDates(+TourPrices) → Reservation(→Passengers,Extras) → Payments`.
A tour has many dated departures; each date has a price grid (date × room × pax type) and tracks `seatsSold/quota`. Everything else (CRM, operations, B2B, CMS, system) hangs off the spine.

- **Plain-language version (share-with-stakeholders):** `docs/DATABASE-EXPLAINED.md`.
- **Full technical schema:** `docs/03-database-schema.md` + the executable **`prisma/schema.prisma`** (source of truth).
- Key groups: auth (`users/roles/permissions`), crm (`customers/leads/crm_*/email_campaigns`), catalog (`destinations/tours/tour_images/tour_itinerary_days/faqs/campaigns`), inventory (`tour_dates/tour_prices/room_types/optional_extras`), booking (`reservations/reservation_passengers/reservation_extras/seat_holds`), money (`payments/refunds/commissions`), supply (`suppliers/hotels/transports`), b2b (`agencies/agency_users`), content (`pages/page_revisions/content_blocks/menus/menu_items/media/redirects/forms/blog_posts`), system (`settings/notifications/audit_logs`).
- **Passport columns were dropped** (`reservation_passengers.passportNo/passportExpiry` no longer exist).

---

## 8. Directory map (annotated)

**`lib/` (domain layer, mostly `server-only`):**
- `db.ts` Prisma singleton · `auth.ts` sessions+login+register (staff & customer) · `money.ts` · `utils.ts` (cn, dates) · `slug.ts` · `theme.ts` (destination gradients) · `labels.ts` (TR enum labels).
- `catalog.ts` public catalog queries · `pricing.ts` `quote()` engine · `reservations.ts` `createReservation` + lookup · `reservationOps.ts` status/payment/notes/assign · `statusMachine.ts`.
- `operations.ts` per-departure lists (pax/rooming/payment; **no passport**) · `account.ts` customer reservations/favorites/profile · `audit.ts`.
- `email.ts` send (Resend|console) + layout · `notify.ts` confirmation + payment emails.
- `blocks.ts` **CMS block registry** (BLOCK_DEFS, field types incl. `image`/`images`/`destination`) · `menu.ts` header/footer menu reads.

**`components/`:**
- `public/*` Header (DB menu + account link), Footer (DB menu), TourCard (+♥), HeroSearch, ReservationView (shared by lookup/customer), StaticPage (renders blocks), DestinationCard, Stars, ContactForm, WhatsAppFab.
- `booking/BookingWizard.tsx` the 9-step client wizard (calls `getQuoteAction`/`submitReservationAction`; has `data-testid` hooks `wizard-next`, `wizard-submit`, `pay-bank`, `kvkk`).
- `admin/AdminShell.tsx` sidebar · `admin/reservation/*` (StatusControl, PaymentForm, NotesPanel, AssignControl) · `admin/tour/*` (TourForm, DateManager, PublishButton) · `admin/cms/*` (**PageBuilder**, MediaPicker, MediaUploader, MediaLibrary, MenuBuilder, NewPageForm).
- `blocks/BlockRenderer.tsx` **server** renderer mapping `block.type` → JSX (dynamic blocks fetch live data).
- `account/*` AccountNav, FavoriteButton, ProfileForm.

**Routes:** see the snapshot in §0 of your tools / the `find` output — every `page.tsx`/`actions.ts`/`route.ts` is listed there. Notable: `app/(public)/rezervasyon/[slug]` (wizard + actions), `app/admin/(panel)/{rezervasyonlar,operasyon,turlar,crm,sayfalar,medya,menuler,ayarlar}`, `app/(account)/hesabim/*`.

---

## 9. Feature status — detail

**Reservation engine (verified).** Wizard → `getQuoteAction` (live, server-side, early-bird aware) → `submitReservationAction` → `createReservation` (txn: conditional quota decrement, customer find-or-create, passenger rows, extras, `RES_NEW` notification) → reference `TA-XXXXXX` → confirmation page + email. Proven: valid booking succeeds, **oversell returns SOLD_OUT**, quota decrements atomically, early-bird price applies.

**Admin reservation ops (verified).** Detail page has the status state-machine (only legal transitions shown), **payment recording** that recomputes paid/balance and auto-advances `WAITING_PAYMENT → PAYMENT_RECEIVED` when cleared (and emails the customer), internal notes, agent assignment. All write `audit_logs`.

**Operations (verified).** `/admin/operasyon/[dateId]` builds pax list, rooming list, payment checklist; CSV export route (`?type=pax|payment`) with UTF-8 BOM. **Passport list + passport CSV were deliberately removed.**

**Tours CRUD (built).** `/admin/turlar/yeni` + `/[id]/duzenle` with `TourForm`, `DateManager` (adds departures with auto-generated price grids), `PublishButton` (draft↔published).

**CMS page builder (verified — the priority).** Blocks are a JSON array on `pages.blocks`. `lib/blocks.ts` is the registry; `BlockRenderer` renders them server-side (dynamic blocks `tourGrid`/`destinationGrid`/`searchBar`/`testimonials` pull live DB data). Editor `PageBuilder.tsx`: block list with **drag-drop reorder + duplicate + per-block settings forms + live iframe preview** (`/onizle/[id]`). **Media library** (`/admin/medya`) uploads via `lib/storage.ts` (**S3/R2 when `S3_*` env set, else local `public/uploads`**) → `media` table; `MediaPicker` modal feeds `image`/`gallery` blocks. **Menu builder** (`/admin/menuler`) edits DB-backed header/footer menus. **Legal pages are now block-based & editable** (slug locked, `isSystem`, can't delete). Public render via the `[...slug]` catch-all; revisions saved on every save. Seeded demo page: **`/kampanyalar`**.

**Version history + restore (verified).** A **"Geçmiş" (Sürüm Geçmişi) drawer** in `PageBuilder` lists saved versions newest-first (timestamp via `formatDateTimeTr`, editor name, block count, note; latest tagged "güncel"). Two server actions in `sayfalar/actions.ts`: `listPageRevisionsAction` (metadata only — no block payload) and `getPageRevisionAction` (one revision's title+blocks, scoped to its page). Each row: **Önizle** → `/onizle/[id]?rev=<id>` (the preview route now renders a specific revision's blocks, falling back to live if the id doesn't match), and **"Bu sürümü yükle"** → **load-into-editor** (sets title+blocks, marks dirty), then the user reviews and clicks **Kaydet** to commit. Restore deliberately does **not** silently mutate the published page; committing it is captured as a new revision with an auto-note (`savePageAction` gained an optional `note` param, e.g. *"‹date› sürümünden geri yüklendi"*). Revisions snapshot **title + blocks only** (not slug/SEO). Component: `components/admin/cms/RevisionHistory.tsx`.

**Page delete (fixed).** `deletePageAction` existed but was wired to no UI (you couldn't delete a page). The Sayfalar list now shows a **Sil** button per row (`components/admin/cms/DeletePageButton.tsx`, `window.confirm` guard) → `deletePageAction` (cascades `page_revisions`, then deletes the page). **`isSystem` legal pages show no Sil** (protected, as before).

**Forms-builder (verified).** Full pipeline on the existing `forms`/`form_submissions`/`leads` tables (no migration). **Admin `/admin/formlar`**: list (create via server-action form), editor (`FormBuilder.tsx` — name/key/active, settings {successMessage, createLead, notify}, and a repeatable field-row editor: label/type/required/options; field types text·email·tel·textarea·select), delete, and a per-form **submissions inbox** (`[id]/gonderiler` — data table, status NEW/READ/ARCHIVED/SPAM via server-action forms, link to the created lead). **Domain** in `lib/forms.ts` (`getFormByKey`, `validateSubmission`, `mapLead` — maps a submission onto Lead by well-known keys then by field type; shared types `FormField`/`FormSettings` live in `lib/blocks.ts` so they're client-safe). **Public**: a new **`form` block** (`dynamic`, with a `form`-typed picker field threaded into `PageBuilder` like `destination`) → `BlockRenderer` `case "form"` fetches the form by key and renders `components/public/DynamicForm.tsx` (client). Submit → `submitFormAction` (`app/(public)/formlar/actions.ts`, **public/no-auth**): validate → `FormSubmission` (+ ip/ua) → optional `Lead` (channel `DIRECT_WEB`) → `ADMIN_ALERT` notification → returns the form's success message. Verified end-to-end (valid+invalid submit, lead creation, inbox render, status change, block picker, public render). **Sidebar gained a "Formlar" item.** NOTE: a demo form `iletisim-formu` ("İletişim Formu") + one test submission/lead were created during verification (runtime, not seeded — a reseed wipes them).

**Elite builder — Phase 1 (verified).** Every block gained a universal **Stil** tab (`BlockStyle` + `STYLE_FIELDS` in `lib/blocks.ts`): background color/image (+overlay), text color, padding, text-align, anchor `#id`, hide-on-mobile/desktop — applied by a shared `BlockShell` wrapper in `BlockRenderer`. New editor field-control types: `color`, `toggle`, `align`, `range`, `richtext` (WYSIWYG), `code`. Per-block settings are split into **İçerik | Stil** tabs (`PageBuilder`; a single `tab` state — note it persists across block selection). Block upgrades: **hero** → background photo + overlay + height + alignment (gradient stays as fallback); **image** → alignment (sol/orta/sağ) + width + rounded + optional link; **richText** → contentEditable **WYSIWYG** (`components/admin/cms/RichTextEditor.tsx`; B/I/U · H2/H3 · list · link · quote → HTML). New **`html`** block for raw HTML/embeds. Staff-authored HTML (richText-as-HTML + html block) renders via `dangerouslySetInnerHTML` after `sanitizeHtml()` in `BlockRenderer` (strips `<script>`, `on*=`, `javascript:`) — acceptable since authoring is staff-gated. richText backward-compat: plain-text bodies (no tags) still render as paragraphs. **Phase 2 (verified):** new blocks — **mediaText** (görsel+yazı, image left/right), **columns** (now a true nesting container — see Phase 4), **quote**, **accordion** (parsePairs + first-open), **iconList** (checklist, 1–2 cols), **banner** (info/success/warning/danger), **map** (Google Maps `?q=…&output=embed`, no API key), **buttonGroup**; plus upgrades: **heading** (H1–H4 + align + color) and **button** (size + full-width + new-tab). All in `lib/blocks.ts` defs + `BlockRenderer` cases (no new field types — reuse the Phase-1 controls). 28 block types total. **Phase 3 (verified):** the "Blok Ekle" inserter is now grouped into **Düzen / İçerik / Medya / Dinamik** (`BLOCK_GROUPS` in `lib/blocks.ts` — with a "Diğer" catch-all so any unlisted block still shows) plus a **live search/filter** box; and the per-block settings panel **resets to the İçerik tab when you switch blocks** (`selectBlock` helper in `PageBuilder`).

**Phase 4 — true block nesting (verified).** `Block` gained `children?: Record<string, Block[]>` (named slots). Two **container blocks**: **`columns`** (slots `col-0…col-(n-1)` from its `count`) and a new **`section`** (slot `main`, for grouping a set of blocks under a shared `Stil` background/padding). `BlockRenderer` is now **recursive** (a `depth` param, `MAX_DEPTH=4`): containers render each slot via `await BlockRenderer({ blocks: children[slot], depth: depth+1 })`; columns children are wrapped in a `NESTED` class that neutralises the `.container-page` page-gutter so blocks fill the column; section just renders its children and lets `BlockShell` apply the bg/padding. **Legacy** columns (pre-nesting `col1/col2/col3` rich-text strings) still render via a fallback. Editor: a new **recursive `renderNode`** in `PageBuilder` renders the block tree; container rows expand/collapse to show their slots, each slot a nested block list + a **"Blok ekle"** button that retargets the single inserter (`addTarget` state → header banner "… içine ekleniyor / Sayfa köküne dön"). All tree edits (move/duplicate/delete/update prop+style/insert) are pure, id-keyed helpers in **`lib/blockTree.ts`**. Reorder: top-level keeps **drag-drop**; all blocks (incl. nested) also get **up/down arrows** (work at any depth). Editor add-depth capped at 3, render depth at 4. The CMS page builder is now feature-complete (Phases 1–4 done).

**Live preview + image remove (verified).** Editing is now **live**: a `draftBlocks Json?` column on `pages` holds the working copy. `PageBuilder.mutate()` (every block edit) debounce-fires `autosavePageAction(id, blocks)` (~700ms) which writes **only `draftBlocks`** (no revision, no publish), then reloads the preview iframe in place (`iframeRef.contentWindow.location.reload()`, no remount/flash). So overlay/photo/text edits appear in the preview within ~1s **without pressing Kaydet**. `/onizle/[id]` renders `draftBlocks ?? blocks`; the **editor loads `draftBlocks ?? blocks`** (resumes unsaved work); the **public catch-all still renders published `blocks` only** (drafts never leak). `savePageAction` (Kaydet) sets `blocks` **and** `draftBlocks` (+ a revision) — i.e. Kaydet promotes draft → published. Preview header shows "Canlı önizleme · otomatik / · güncelleniyor…". The preview pane is **`lg:sticky lg:top-4 lg:self-start`** and **viewport-height** (`lg:h-[calc(100vh-6.5rem)]`) so it stays pinned/visible while you scroll the much taller editor column (previously it was a short 78vh box at the top of a tall grid cell → blank space below + page clipped). Also fixed: the **`image` field now has a remove (✕) button** (on the thumbnail + a trash button) — previously an added photo could only be replaced, not cleared. NOTE the earlier "karartma/overlay çalışmıyor" report was actually the **stale preview** (overlay always rendered correctly); live preview makes it visibly work.

**Premium CRM — Phase 1 (verified).** The CRM schema was already enterprise-grade (`crm_pipelines/stages/opportunities/activities/tags/segments`, `email_campaigns`, 360° `customers` with lifecycle+owner) but `/admin/crm` was a **read-only** dashboard. New: domain layer **`lib/crm.ts`** (`listStaff`, `listLeads`, `convertLeadToOpportunity`) + **`crm/actions.ts`** (`setLeadStatusAction`, `assignLeadAction`, `convertLeadAction`) + a client **`components/admin/crm/LeadsInbox.tsx`**: an **actionable leads inbox** with status filter tabs (+counts), per-lead status change (NEW/CONTACTED/LOST), assign-to-agent, and **"Fırsata dönüştür"** → `convertLeadToOpportunity` (find-or-create `Customer` by email, create OPEN `CrmOpportunity` in the default pipeline's first stage, log a NOTE activity, set lead CONVERTED + customer lifecycle OPPORTUNITY). Verified: convert created an opportunity (kanban card + open-opp count +1), lead → Dönüştürüldü. **Phase 2 (verified):** interactive **drag-and-drop Kanban** (`components/admin/crm/PipelineBoard.tsx` — optimistic move via `moveOpportunityAction`, re-synced from server props on refresh; dropping into a won/lost stage closes the opp), an **opportunity detail drawer** (`OpportunityDrawer.tsx` — full details + **activity timeline** + log activity via `logActivityAction` + mark **Won/Lost** via `setOpportunityStatusAction`), a **create-opportunity** modal, and a **form-origin badge** on leads (forms→leads already fed the inbox when a form's `createLead` is on; `listLeads` now includes `submissions.form.name` and `LeadsInbox` shows an "İletişim Formu"-style chip). Verified: drag move+persist, drawer timeline, log activity, mark won (open-opp count + card styling), create opp, form badge. **Phase 3 (verified):** **Contacts 360°** — `/admin/musteriler` list (search name/email/phone + lifecycle/owner filters via a GET form; sidebar item "Müşteriler") + `/admin/musteriler/[id]` profile: editable header (`components/admin/crm/CustomerEditor.tsx` — contact/lifecycle/owner/marketing-consent/notes + tags add/remove with find-or-create), stats (reservations / total paid / open opps), and sections for reservations, opportunities, **activity timeline + `ActivityLogger`**, favorites, messages. Domain `listCustomers`/`getCustomerProfile`/`listTags` in `lib/crm.ts`; `musteriler/actions.ts` (`updateCustomerAction`/`addCustomerTagAction`/`removeCustomerTagAction`). Reservation status labels via `lib/labels.ts`. **Phase 4 (verified):** **Activities & Tasks** — `/admin/gorevler` (sidebar "Görevler"): all PENDING activities grouped **Gecikmiş / Bugün / Yaklaşan / Tarihsiz** (grouped server-side with `new Date()`), a scope toggle (**Bana atananlar / Tümü** via `?scope`), one-click **Tamamla** (`completeActivityAction` → status DONE + completedAt), and **"+ Yeni Görev"** (`createTaskAction`). Tasks deep-link to their customer (`/admin/musteriler/[id]`) + show opportunity + assignee. The in-context activity loggers (`OpportunityDrawer` + customer `ActivityLogger`) gained an optional **due-date** input → a dated activity becomes a PENDING task that surfaces here. `listTasks`/`createTask` in `lib/crm.ts`; `TaskBoard.tsx` (complete + new-task form). **Phase 5 (verified):** **Segments & Campaigns** — `/admin/pazarlama` (sidebar "Pazarlama"): **dynamic segments** (`CrmSegment`; filter by lifecycle + tag + marketing-consent; live member counts) via `components/admin/crm/SegmentForm.tsx`, and **email campaigns** — create → compose (`CampaignComposer.tsx`: name/segment/subject/body) → **Gönder** (`sendCampaignAction` → `sendCampaign()` in `lib/crm`: resolves the segment, emails each member via `lib/email` `sendEmail`+`emailLayout`, writes `EmailCampaignRecipient` rows SENT/FAILED, sets campaign SENT + `stats` JSON) with a recipients/results table. Domain in `lib/crm.ts`: `listSegments`/`createSegment`/`resolveSegmentCustomers`/`countSegmentCustomers`/`listCampaigns`/`getCampaign`/`createCampaign`/`sendCampaign`. Verified: 3-member segment → campaign sent → 3 recipients SENT (console transport; set `RESEND_API_KEY` + `EMAIL_FROM` to send for real). KVKK: segments default to **consent-only**. **Phase 6 (verified):** **CRM dashboard** — `/admin/raporlar` (sidebar "Raporlar"): read-only analytics from `getCrmDashboard()` in `lib/crm.ts` (Prisma `groupBy`/`count`/`_sum`) — stat cards (open pipeline value, win rate, pending/overdue tasks, contacts), **pipeline value by stage**, **conversion funnel** (talepler → açık fırsat → kazanıldı), **win/loss**, lifecycle + leads-by-status breakdowns (CSS bars, no chart lib), and an **agent-performance** table. Cross-checked accurate against the CRM page's own counts. **★ The premium-CRM epic (Phases 1–6) is COMPLETE: leads workflow · interactive pipeline · contacts 360° · tasks · segments & campaigns · dashboard.** NOTE: no delete-opportunity UI (use Won/Lost); demo CRM data lingers (3 won opps incl. "Deneme Fırsatı — Test", "VIP" tag, task "İtalya turu teklifini hazırla", segment "CUSTOMER Segmenti", campaign "Yaz Kampanyası 2026").

**Customer dashboard (verified).** `registerCustomer` links by email so guest bookings are auto-claimed (proven: registering `ayse@example.com` surfaced her guest booking `TA-7H2K9M`). My-reservations, reservation detail (reuses `ReservationView`), favorites (♥ on all `TourCard`s + tour detail; `favIds` threaded into home/listing/destination/detail), profile (email locked, KVKK consent).

**Auth + email (verified).** Signed JWT sessions reject tampered/old/forged cookies (all 307→login); real login works. Emails (confirmation + payment-received) marked SENT via the dev console transport; set `RESEND_API_KEY` + verified `EMAIL_FROM` to actually send.

---

## 10. Key decisions & user preferences (carry these forward)

- **No online payments right now** (user deprioritized). Don't assume payment is the next step.
- **Zero passport data** (user removed it for security/KVKK). Do not re-add a passport field/upload. KVKK posture is now "we don't collect special-category data."
- **No document/file uploads of customer ID/passport** — declined on security grounds.
- **The page builder is the user's favorite/most-essential feature** — they keep asking to extend it.
- **Direct SDKs, no orchestration wrappers** (no LangChain/Firebase). (From the user's long-standing preference.)
- **Turkish-first UI.** Money always visible. Mobile-first.
- The user steers feature-by-feature and likes verified, working increments — **always typecheck and verify in the browser before claiming done.**
- The agreed development order (their words: "continue in order"): **Phase 1** auth✓ → email✓ → staging deploy → ~~payments~~(deprioritized) → ~~KVKK passport encryption~~(moot, no passport); **Phase 2** vouchers/PDFs → accounting → customer area✓; **Phase 3** B2B portal → builder polish.

---

## 11. What's next (pick with the user)

Most-likely candidates, roughly in value order:
1. **Finish the customer area's last bit:** *message-the-agency* from a reservation (the `messages` table is ready; no passport concerns). *(Document upload was declined.)*
2. **Voucher / proforma PDF generation** (needed to service confirmed bookings). No PDF lib yet — add `@react-pdf/renderer`.
3. **Accounting module** — revenue + daily/monthly reports, outstanding, supplier payments, commission, refunds (data already captured by payments/commissions).
4. **B2B sub-agency portal** — net pricing tier, agency balance/commission, scoped reservations, vouchers (schema ready; big build; needs auth realm `B2B`, which exists).
5. **Builder extras** (the user's favorite area): reusable/global blocks (`content_blocks` table exists), columns/nesting layout block, page templates. _(revision-restore UI + forms-builder ✅ done — §9.)_
6. **Deploy / prod hardening — partly DONE (see `DEPLOY.md`):** ✅ `git init` + initial commit, ✅ baseline Prisma migration, ✅ env-driven base URL, ✅ S3/R2-ready uploads (`lib/storage.ts`), ✅ `.env.example`. **Remaining (need your accounts/infra):** staging deploy (Vercel), managed Postgres, set prod env (`RESEND_API_KEY`, `S3_*`, `AUTH_SECRET`, `NEXT_PUBLIC_BASE_URL`), automated DB backups, integration tests around the booking/quota/payment txn.

---

## 12. How to verify your work (the workflow that worked)

1. **`rm -rf .next/types && npx tsc --noEmit`** — must be 0 errors. (Clear stale types first.)
2. **`curl` against `http://localhost:3100`** for public pages + content checks. Strip ANSI with `sed $'s/\\x1b\\[[0-9;]*m//g'`.
3. **Admin/customer pages need a real session** (signed cookie). Either log in via the browser (Preview MCP) or generate a token — the old plaintext-cookie curl trick no longer works.
4. **Browser flows via Claude Preview MCP** (`preview_start` name `tur-acente`, `preview_eval`, `preview_screenshot`). ⚠️ **Browser automation has been flaky**: the page sometimes drifts between `eval` calls, and **reseeding logs you out**. Re-login and re-check the URL before asserting.
5. **To exercise `server-only` logic in isolation**, drop a **temporary route under `app/api/devtest/...`** (NOT an `_`-prefixed folder — underscore folders are *private* and 404), `curl` it, then delete it. This is how the booking engine, payment ledger, and email were verified.

---

## 13. Gotchas & traps (consolidated)

- Postgres won't start without `LC_ALL`/`LANG` (see §3).
- Port **3000 is another app — use 3100**.
- **Reseed → re-login** (new user IDs).
- Prisma **single-line enums are invalid**; raw SQL needs **quoted camelCase columns**.
- **After `prisma db push` (or any schema change), RESTART the dev server.** `db push` regenerates the Prisma client on disk (so `tsc` passes), but the running Next dev process keeps the **old client in memory** → queries on the new column 500 with *"Unknown argument `x`"*. Stop+start the preview server. (Bit us adding `pages.draftBlocks`.)
- `app/api/_foo` (underscore) is **excluded from routing** — use a non-underscore name for temp routes.
- Uploads go through **`lib/storage.ts`**: S3/R2 object storage when the `S3_*` env vars are set, else local `public/uploads` (dev only — ephemeral on serverless). **Set the `S3_*` vars in prod** (see `.env.example`).
- Email silently "succeeds" via console when `RESEND_API_KEY` is empty — check the dev-server log / `notifications` table.
- Prisma `@db.Decimal` is used for `exchangeRate` and `commissionPercent`; everything else money-related is `Int` minor units.
- `metadataBase` now reads **`NEXT_PUBLIC_BASE_URL`** (falls back to `localhost:3100`) — set it to the real domain in prod.

---

## 14. Demo accounts & sample data

- **Staff admin:** `admin@turacente.com` / `admin1234` → `/admin`.
- **B2B:** `deniz@gezgintur.com` / `acente1234` (portal not built).
- **Customer:** `ayse@example.com` / `test1234` — created during verification; has a claimed booking (`TA-7H2K9M`) + 1 favorite. **Exists only until the next reseed** (seed doesn't create customer logins).
- Seeded: 5 destinations, 6 tours, 13 departures, 78 price rows; reservations `TA-7H2K9M` (Sharm, confirmed/paid), `TA-3P8Q1R` (İtalya, waiting-payment), `TA-9X4L2D` (Moskova, B2B); CRM pipeline + opportunities; header/footer menus; block-based legal pages; `/kampanyalar` demo CMS page; testimonials.

---

## 15. The blueprint docs (`docs/`)

The original full specification (written before the build) — still the design reference:
`01-prd.md` · `02-roles-and-journeys.md` · `03-database-schema.md` · `04-api-and-frontend.md` · `05-business-logic.md` (reservation/payment/admin logic) · `06-seo-and-security.md` · `07-seed-data.md` · `08-crm.md` · `09-cms-page-builder.md` · `DATABASE-EXPLAINED.md` (plain language). Also `README.md` (index/stack/roadmap) and `RUNNING.md` (run guide).

> Note: some docs describe things not yet built (B2B, full payments) or since-changed (they mention passport encryption — **passport handling has been removed entirely**). When a doc and this HANDOFF disagree, **HANDOFF + `prisma/schema.prisma` win.**

---

*Last updated at handoff. `tsc` clean, ~103 source files, 60 tables. Good luck — keep increments small, typecheck, and verify in the browser before saying "done."*
