# 06 — SEO Plan · Security & Compliance Plan

## M. SEO plan

### M.1 URL & IA
SEO-shaped Turkish slugs, stable forever (301 on slug change):
- Destination hubs: `/turlar/misir-turlari`, `/turlar/moskova-turlari`, `/turlar/italya-turlari`, `/turlar/beneluks-turlari`, `/turlar/yunanistan-turlari`
- Tour detail: `/tur/misir-sharm-el-sheikh-5-gece`
- Blog: `/blog/misir-vize-rehberi`
Internal linking: destination hub ↔ its tours ↔ related blog posts ↔ similar tours; breadcrumb on every page.

### M.2 On-page
Per page `generateMetadata()` from DB (`seoTitle`, `seoDescription`, OG image = cover).
H1 = tour/destination title; semantic headings for itinerary; descriptive `alt` on every image
(stored on `tour_images.alt`); canonical URLs; hreflang scaffold (`tr` now, `en`/`ru` later);
fast LCP (next/image, priority hero, ISR, edge cache).

### M.3 Structured data (`lib/seo/schema.ts`, JSON-LD)
- Tour detail → `Product`/`TouristTrip` + `Offer` (price, priceCurrency TRY, availability from quota), `AggregateRating` (from testimonials/ratings).
- FAQ sections → `FAQPage`.
- Blog → `Article`/`BlogPosting`; Org → `TravelAgency` + `LocalBusiness` (NAP, logo, sameAs socials); breadcrumbs → `BreadcrumbList`.

### M.4 Technical
`app/sitemap.ts` (destinations + published tours + blog, lastmod from `updatedAt`),
`app/robots.ts`, dynamic OG images (`next/og`), image CDN + AVIF/WebP, preconnect, no CLS,
Core Web Vitals budget (LCP <2.5s, INP <200ms, CLS <0.1). Structured 404/410 for retired tours.

### M.5 Content/keyword strategy (Turkish tourism)
Target clusters per destination: `{dest} turları`, `{dest} turu fiyatları`, `{dest} vize`,
`{dest} gezilecek yerler`, `erken rezervasyon {dest} turu`, `{dest} 5 gece tur`. Blog/travel-guide
feeds the hubs (vize rehberi, gezi rehberi, en iyi zaman, bütçe). Campaign landing pages for
early-booking. Each tour card SEO-friendly (title, price, duration, "from ₺X").

---

## N. Security & compliance plan

### N.1 Authentication
Auth.js sessions (httpOnly, Secure, SameSite=Lax), separate realms (customer/staff/b2b),
Argon2id password hashing, email verification, optional TOTP 2FA (enforced for SUPER_ADMIN &
ACCOUNTING), login throttling + lockout, password reset via signed short-lived tokens.

### N.2 Authorization (RBAC)
Permission-based (doc 02). `requirePermission(perm, scope)` on every server action & `/api`
handler; route-group middleware blocks wrong-realm access; **scoped reads** force
`agencyId`/`customerId` filters server-side. Default-deny. No authorization logic in the client.

### N.3 Input & output safety
Zod validation on every boundary (form, action, API, webhook). Prisma parameterized queries
(no raw concatenation). Output encoding via React; sanitize rich text (blog/itinerary) with a
strict HTML allowlist. CSRF protection on mutations; strict CORS (same-origin app, allowlist for
B2B API keys). Security headers via middleware: CSP (nonce-based), HSTS, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy.

### N.4 Rate limiting & abuse
Redis token-bucket on: auth (`5/min/IP`), booking create + hold (`10/min/IP`), lookup,
contact/lead, B2B API (per key). Bot protection (hCaptcha/Turnstile) on contact + register.

### N.5 File uploads
Private S3/R2 buckets; signed, time-boxed PUT/GET URLs; MIME + magic-byte + size checks;
filenames randomized (store original in DB); images re-encoded to strip metadata; no public ACLs;
AV scan hook for documents.

### N.6 Payment security
No PAN ever touches our servers — provider-hosted 3DS pages/tokens only; PCI-DSS SAQ-A posture;
webhooks signature-verified + idempotent; amounts re-validated server-side; secrets in env/KMS,
never in client bundles.

### N.7 KVKK / GDPR (data protection)
- **Special-category data:** passport/ID numbers encrypted at rest (app-layer AES-256-GCM, key in
  KMS), excluded from default Prisma selects, access permissioned + audited.
- **Consent:** explicit checkboxes at booking/registration (terms, KVKK aydınlatma metni,
  marketing opt-in separate & unchecked); consent timestamp stored (`kvkkConsentAt`).
- **Data subject rights:** export & delete (right to erasure) flows; soft-delete + scheduled
  hard-purge of PII after retention window (e.g. passport data purged N days post-travel).
- **Retention:** policy per data class; cron job purges expired sensitive fields; minimization
  (collect passport only when the tour requires visa/international travel).
- **Transparency:** aydınlatma metni, açık rıza, çerez (cookie) consent banner, processor list.

### N.8 Audit, logging, monitoring
`audit_logs` on every staff/B2B mutation + sensitive read (passport export). Structured app logs
(no PII in logs), Sentry for errors, alerting on auth anomalies & webhook failures.

### N.9 Operational security & backups
Secrets via env/secret manager; least-privilege DB roles; migrations reviewed; automated daily
Postgres backups + PITR, periodic restore drills; file-store versioning; staging mirrors prod
with anonymized data; dependency scanning + Dependabot; incident runbook + breach-notification
process (KVKK 72h).
