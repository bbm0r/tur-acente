# 07 — Seed / Sample Data (R)

Realistic seed for `prisma/seed.ts`. Prices in **EUR minor units** (base), displayed in TRY at
runtime rate. Dates are 2026 future departures (today = 2026-06-08). Slugs are Turkish/SEO.

## Shared catalog

### room_types
| code | nameTr | occupancy | maxAdults | maxChildren |
|------|--------|-----------|-----------|-------------|
| SGL | Tek Kişilik Oda | SINGLE | 1 | 0 |
| DBL | İki Kişilik Oda | DOUBLE | 2 | 1 |
| TRP | Üç Kişilik Oda | TRIPLE | 3 | 1 |
| FAM | Aile Odası | FAMILY | 2 | 2 |

### optional_extras (global)
Seyahat Sağlık Sigortası €25/pax · Vize Hizmet Bedeli €60/pax · Ekstra Tur Paketi €90/pax ·
Havalimanı Özel Transfer €40/booking · Tekne/Yat Turu €55/pax.

### roles → permissions
Seed the 7 roles (doc 02) with their permission bundles; create one `SUPER_ADMIN` user
(`admin@turacente.com` / env-set password), one demo `SALES_AGENT`, one demo B2B `AGENCY_USER`.

### settings
`currency.base=EUR`, `currency.display=TRY`, `currency.rateSource=tcmb`, `quota.lowThreshold=5`,
`hold.ttlMinutes=20`, `booking.depositPercent=30`, `company.iban=TR.. / name / address`,
`whatsapp.number=+90...`, `email.from=rezervasyon@turacente.com`.

### pages (legal) + general FAQs + testimonials
Seed `pages`: `kosullar`, `gizlilik` (KVKK aydınlatma), `iptal-iade`, `hakkimizda`. Seed ~8
general FAQs (vize, ödeme, iptal, bagaj) and 6 testimonials (4–5★).

---

## Destinations (5)

| slug | nameTr | country | featured |
|------|--------|---------|----------|
| `misir-turlari` | Mısır Turları | Egypt | ✅ |
| `moskova-turlari` | Rusya Moskova Turları | Russia | ✅ |
| `italya-turlari` | İtalya Turları | Italy | ✅ |
| `beneluks-turlari` | Benelüks Turları | Belgium/Netherlands/Luxembourg | ✅ |
| `yunanistan-turlari` | Yunanistan Turları | Greece | ✅ |

---

## Tours (sample — 1–2 per destination)

### 🇪🇬 Mısır
**Tour A — `misir-sharm-el-sheikh-5-gece`** · "Sharm El Sheikh 5 Gece Her Şey Dahil"
- destination: misir-turlari · 6 gün / 5 gece · transport FLIGHT · hotel FIVE_STAR · visa: kapıda · guided + free time
- basePrice **€549** · included: gidiş-dönüş uçak, 5 gece ultra herşey dahil otel, transferler, rehberlik · excluded: vize (€25 kapıda), öğle turları, kişisel harcamalar
- itinerary: D1 İstanbul→Sharm, otele yerleşme · D2 serbest/plaj · D3 Ras Muhammed dalış-şnorkel (ekstra) · D4 çöl safari (ekstra) · D5 Naama Bay serbest · D6 dönüş
- departures & price grid (adult/child-with-bed/SGL-supp, EUR):
  | start | end | quota | DBL adult | CHILD_WB | SGL supp | earlyBird |
  |-------|-----|-------|-----------|----------|----------|-----------|
  | 2026-07-12 | 2026-07-17 | 40 | 599 | 449 | +160 | 549 (until 06-20) |
  | 2026-08-09 | 2026-08-14 | 40 | 649 | 479 | +180 | — |
  | 2026-09-13 | 2026-09-18 | 30 | 549 | 419 | +150 | 499 (until 08-01) |

**Tour B — `misir-kahire-nil-7-gece`** · "Kahire & Nil Nehri Gemi Turu" · 8g/7n · FLIGHT+CRUISE · 5★/cruise · visa required
- basePrice **€899** · piramitler, Luxor, Asuan, Nil teknesi tam pansiyon · departures 2026-10-04, 2026-11-08 (quota 30).

### 🇷🇺 Rusya Moskova
**Tour A — `moskova-3-gece`** · "Moskova 3 Gece Şehir Turu" · 4g/3n · FLIGHT · 4★ · visa: e-visa
- basePrice **€499** · Kızıl Meydan, Kremlin, metro turu, rehberlik · departures:
  | start | end | quota | DBL adult | CHILD_WB | SGL supp |
  |-------|-----|-------|-----------|----------|----------|
  | 2026-09-25 | 2026-09-28 | 30 | 549 | 399 | +130 |
  | 2026-10-29 | 2026-11-01 | 30 | 499 | 379 | +120 |

**Tour B — `moskova-st-petersburg-6-gece`** · "Moskova & St. Petersburg" · 7g/6n · FLIGHT+TRAIN · €899 · departures 2026-08-15.

### 🇮🇹 İtalya
**Tour A — `klasik-italya-7-gece`** · "Klasik İtalya: Roma · Floransa · Venedik" · 8g/7n · FLIGHT+BUS · 4★ · no visa (Schengen)
- basePrice **€999** · 3 şehir, rehberli şehir turları, müze geçişleri (ekstra) · departures:
  | start | end | quota | DBL adult | CHILD_WB | SGL supp | lastMinute |
  |-------|-----|-------|-----------|----------|----------|-----------|
  | 2026-09-06 | 2026-09-13 | 35 | 1099 | 799 | +320 | — |
  | 2026-10-11 | 2026-10-18 | 35 | 999 | 749 | +300 | 949 (from 10-04) |

**Tour B — `roma-4-gece`** · "Roma 4 Gece" · 5g/4n · FLIGHT · 4★ · €699 · departures 2026-11-20, 2026-12-27 (yılbaşı +€150).

### 🇧🇪🇳🇱🇱🇺 Benelüks
**Tour A — `beneluks-6-gece`** · "Benelüks Turu: Brüksel · Amsterdam · Lüksemburg" · 7g/6n · FLIGHT+BUS · 4★ · no visa (Schengen)
- basePrice **€1099** · Brüksel, Bruges, Amsterdam (tekne turu), Lahey, Lüksemburg, Köln (ekstra) · departures:
  | start | end | quota | DBL adult | CHILD_WB | SGL supp |
  |-------|-----|-------|-----------|----------|----------|
  | 2026-09-19 | 2026-09-25 | 30 | 1149 | 849 | +350 |
  | 2026-10-17 | 2026-10-23 | 30 | 1099 | 829 | +340 |

### 🇬🇷 Yunanistan
**Tour A — `atina-4-gece`** · "Atina 4 Gece" · 5g/4n · FLIGHT · 4★ · visa: Schengen
- basePrice **€599** · Akropolis, Plaka, antik turlar · departures:
  | start | end | quota | DBL adult | CHILD_WB | SGL supp | earlyBird |
  |-------|-----|-------|-----------|----------|----------|-----------|
  | 2026-07-18 | 2026-07-22 | 35 | 649 | 469 | +170 | 599 (until 06-25) |
  | 2026-09-12 | 2026-09-16 | 35 | 599 | 449 | +160 | — |

**Tour B — `yunan-adalari-rodos-7-gece`** · "Yunan Adaları: Rodos 7 Gece" · 8g/7n · FLIGHT · 4★/5★ · €849 · departures 2026-08-22, 2026-09-05.

---

## Sample reservations (for admin demo)
1. `TA-7H2K9M` — Mısır Sharm 07-12, 2 adult + 1 child, DBL, +sigorta, status **CONFIRMED**, paid full (CREDIT_CARD).
2. `TA-3P8Q1R` — İtalya Klasik 10-11, 2 adult, DBL + SGL supp split, status **WAITING_PAYMENT** (BANK_TRANSFER), balance open.
3. `TA-9X4L2D` — Moskova 09-25, 1 adult SGL, B2B via "Gezgin Tur" agency, status **PAYMENT_RECEIVED**, commission accrued.

## Sample agency (B2B)
`Gezgin Tur` · slug `gezgin-tur` · tier GOLD · commission 8% · creditLimit ₺50.000 · 1 owner user.

## Sample blog posts
`misir-vize-rehberi`, `moskova-gezilecek-yerler`, `italya-tren-rehberi`,
`beneluks-ne-zaman-gidilir`, `yunan-adalari-karsilastirma` — each linked to its destination,
status PUBLISHED, with SEO fields.

> The `prisma/seed.ts` script encodes exactly this: upsert destinations → room types → extras →
> tours (+images, itinerary, faqs) → tour_dates → tour_prices → campaigns → roles/permissions →
> users → agency → sample reservations/payments → pages/blog/testimonials/settings. Idempotent
> (upsert by slug/key) so it can be re-run safely.
