# Deploy guide — Tur Acente

The app is a single Next.js 15 monolith + PostgreSQL. Below is the path to a live
deployment. Items marked **(you)** need your accounts/credentials.

## 0. What's already done (ship-readiness)
- ✅ Git repository initialized (`.env` is gitignored — never commit it).
- ✅ Prisma **migrations** baselined (`prisma/migrations/0_init`); use `npm run db:migrate` for changes.
- ✅ `metadataBase` is env-driven (`NEXT_PUBLIC_BASE_URL`).
- ✅ Uploads are **S3/R2-ready** via `lib/storage.ts` (local fallback for dev).
- ✅ `.env.example` documents every variable.

## 1. Managed Postgres **(you)**
Provision Postgres (Neon, Supabase, RDS, …). Copy its connection string → `DATABASE_URL`.

## 2. Environment variables **(you)**
Set these in your host (e.g. Vercel project settings) — see `.env.example`:
- `DATABASE_URL` — managed Postgres
- `NEXT_PUBLIC_BASE_URL` — the real domain (e.g. `https://turacente.com`)
- `AUTH_SECRET` — generate: `openssl rand -base64 32`
- `RESEND_API_KEY` + `EMAIL_FROM` — to send real email (else it logs to console)
- `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`, `S3_ENDPOINT`, `S3_REGION` — object storage for uploads
- `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_WHATSAPP`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## 3. Object storage (uploads) **(you)**
Create an S3/R2 bucket with public read for the `uploads/` prefix, set the `S3_*` vars.
Cloudflare R2: `S3_REGION=auto`, `S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com`,
`S3_PUBLIC_URL=https://<your-public-r2-domain>`. With these set, uploads go to the bucket
automatically (no code change). Without them, it uses local disk (dev only).

## 4. Database migrations
On first deploy and every release, apply migrations against the prod DB:
```bash
npx prisma migrate deploy
```
Optionally seed demo data once (NOT for a real prod dataset): `npm run db:seed`.
⚠️ `db:seed` wipes & reinserts demo data — never run it against a live database with real bookings.

## 5. Deploy **(you)**
**Vercel** (recommended): import the repo, set the env vars (step 2), build command `npm run build`
(already runs `prisma generate`). Add `npx prisma migrate deploy` as a release/deploy step.
Any Node host works too (`npm run build` → `npm run start`).

## 6. Backups **(you)**
Enable automated daily backups / point-in-time recovery on the managed Postgres (most providers
offer this out of the box). Verify a restore at least once.

## 7. Post-deploy smoke test
- Public home + a tour detail load; a reservation can be created.
- `/admin/giris` login works; CMS preview renders; an image upload lands in the bucket.
- A test email actually sends (with `RESEND_API_KEY` set).

## Not yet built (see HANDOFF §11)
Online card payments (deprioritized), voucher/proforma PDFs, accounting, B2B portal,
automated integration tests around the booking/quota/payment transaction.
