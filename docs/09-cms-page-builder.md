# 09 — CMS & Visual Page Builder (WordPress-like, custom)

**Goal:** non-technical staff create and edit pages, menus, forms, and media entirely from the
admin — no code, no developer — using a **block-based visual builder**. It gives the freedom of
WordPress but is custom, type-safe, and **integrated**: blocks render live booking data and forms
feed the CRM. This replaces the need to run WordPress alongside the platform.

### Why custom instead of WordPress
- One auth / RBAC / audit / database / deploy — not two systems to secure and sync.
- Blocks render **live dynamic data** (tour grids, hero search, availability, prices) — in WP that needs plugins and a separate API.
- Forms write straight into the CRM (doc 08); no third-party form plugin.
- No plugin attack surface; KVKK-controlled data; consistent design system.

## Schema additions (detail in prisma/schema.prisma)
- **`pages` upgraded:** hierarchical (`parentId`), **block-based** (`blocks` JSON), `template`, `status` (draft/published/scheduled/archived), `publishedAt`/`scheduledAt`, full SEO (`seoTitle`, `seoDescription`, `ogImageKey`, `noindex`), `isSystem` (legal pages can't be deleted), `authorId`.
- **`page_revisions`** — every save snapshots blocks; restore any version.
- **`content_blocks`** — reusable & global blocks (edit once, update everywhere).
- **`menus` + `menu_items`** — hierarchical navigation per location.
- **`media`** — central media library.
- **`redirects`** — 301/302/410 management.
- **`forms` + `form_submissions`** — admin-built forms → CRM leads.

## Block system (the core)
A page's `blocks` is an ordered JSON tree: `{ id, type, props, children? }`. Rendered server-side by
**`BlockRenderer`** (a `type → component` map); dynamic blocks fetch live data and are ISR-cached.
Each block type has a **typed props schema (Zod)** that auto-generates its settings form.

**Block catalog**
| Layout | Content | Dynamic (live data) | Conversion |
|--------|---------|---------------------|------------|
| section / columns | richText | **tourGrid** (filter by dest/featured/campaign/price) | cta / banner |
| spacer / divider | image / gallery / video | **destinationGrid** | **form** (→ CRM) |
| container | heading | **searchBar** (hero search) | newsletter |
| | testimonials | **priceTable / itinerary** (tour-bound) | whatsappCta |
| | faqAccordion | **blogList** | |
| | map / contactInfo | availability/campaign strip | |
| | html (sanitized) | | |

So a marketer can build a `/kampanyalar/erken-rezervasyon-misir` landing page that shows a live,
filtered tour grid + hero search + a lead form — all without a developer.

## Page builder UX (the "great admin panel")
Three-pane editor:
- **Left** — block outline: add (from `BlockPalette`), drag-reorder, duplicate, delete, nest.
- **Center** — **live preview** with device toggles (mobile/tablet/desktop).
- **Right** — `BlockSettingsPanel`: per-block form generated from its Zod schema (text, media picker, color, toggle, link, dynamic-source filters).

Plus: autosave + **revision history** (restore), **Draft / Publish / Schedule**, SEO panel
(title, description, OG image, canonical, noindex), page settings (parent for hierarchy, template:
default / full-width / landing / with-sidebar, slug with auto-301 on change), duplicate page,
**reusable blocks** (save a section to the library; **global blocks** update everywhere).

## Menus / navigation
`MenuBuilder` — drag-drop hierarchical tree per location (header / footer / mobile). Each item targets
a **page / destination / tour / blog post** (resolved by id) or a **custom URL**; supports new-tab,
visibility, and nesting (mega-nav). The destinations mega-menu can auto-populate.

## Media library
Central `media` store (images / docs / video): grid + folders + search; `alt` + `caption` for SEO/a11y;
auto WebP/AVIF + responsive sizes on upload; **`MediaPicker`** reused everywhere (page blocks, tours,
blog covers) so assets are uploaded once and reused.

## Forms → CRM
`FormBuilder`: define fields (text / email / phone / select / checkbox / date / number), validation,
success message, notification email, **"create CRM lead"** toggle, and KVKK consent checkbox. Submissions
are stored, create/attach a **Lead + Contact** with source attribution (doc 08), and notify the owner.
Embed via the `form` block on any page.

## Redirects & SEO ops
`RedirectManager` (301/302/410, from→to, hit counter); slug changes auto-create a 301; sitemap includes
published CMS pages; per-page `noindex`. Keeps SEO equity when content is restructured.

## Routing
Published pages resolve via a catch-all `app/(public)/[...slug]/page.tsx` (after reserved routes like
`/turlar`, `/tur`, `/rezervasyon`), building the path from the parent chain; status + schedule gate
visibility; ISR with on-publish revalidation.

## Permissions (extends doc 02)
`content:write` (CONTENT_EDITOR + SUPER_ADMIN) for pages/menus/forms/media; publish can be split from
edit; `isSystem` legal pages are editable but **not deletable**. All edits **audited + revisioned**.

## Components
`PageBuilder`, `BlockPalette`, `BlockEditor`, `BlockRenderer`, `BlockSettingsPanel`,
`ReusableBlockLibrary`, `MenuBuilder`, `MediaLibrary`, `MediaPicker`, `FormBuilder`,
`FormSubmissionsInbox`, `RedirectManager`, `RevisionHistory`, `SeoPanel`, `PageTree`.
