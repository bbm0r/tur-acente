# 04 — API Routes · Frontend Structure · Component List

Next.js App Router. Reads use **Server Components** (direct domain-service calls, no fetch
round-trip). Mutations use **Server Actions** + a thin REST surface (`/api/*`) for webhooks,
B2B/partner access, exports, and the booking widget. All inputs validated with Zod; all
mutations authorized via `requirePermission()`; all staff/B2B mutations audited.

## G. API route design

### Public / booking (`/api/public`, `/api/booking`)
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/public/tours` | List/search (q, destination, dateFrom, dateTo, adults, children, priceMin, priceMax, duration, transport, hotelCat, availability, visa, guided, campaign, sort, page) |
| GET | `/api/public/tours/:slug` | Tour detail incl. dates + price grid |
| GET | `/api/public/destinations` | Destinations list |
| GET | `/api/public/tour-dates/:id/quote` | Live price for {date, pax, room, extras, campaign} |
| POST | `/api/booking/hold` | Place seat hold → `{ holdToken, expiresAt }` |
| POST | `/api/booking/reservations` | Create reservation (converts hold) → `{ reference }` |
| GET | `/api/booking/lookup` | Lookup by `reference` + email/phone |
| POST | `/api/leads` | Contact / "agency will contact me" |
| POST | `/api/newsletter` | Subscribe |

### Auth (`/api/auth/*` via Auth.js) + customer (`/api/account`)
| GET/POST | `/api/account/reservations` · `/:reference` | Own reservations |
| POST | `/api/account/documents` | Upload passport/doc (signed S3 PUT) |
| POST | `/api/account/reservations/:id/messages` | Message agency |
| POST | `/api/account/reservations/:id/cancel-request` | Request cancel/change |
| POST/DELETE | `/api/account/favorites/:tourId` | Toggle favorite |

### Admin (`/api/admin/*`) — permission-gated
| Resource | Routes |
|----------|--------|
| Tours | `GET/POST /tours`, `GET/PUT/DELETE /tours/:id`, `POST /tours/:id/images`, `PUT /tours/:id/itinerary`, `PUT /tours/:id/publish` |
| Dates | `GET/POST /tours/:id/dates`, `PUT/DELETE /dates/:id`, `PUT /dates/:id/prices`, `PUT /dates/:id/status` |
| Reservations | `GET /reservations` (filters), `GET /reservations/:id`, `PUT /reservations/:id/status`, `PUT /:id/assign`, `POST /:id/notes`, `POST /:id/cancel`, `GET /reservations/export` |
| Payments | `POST /reservations/:id/payments`, `POST /reservations/:id/refunds`, `PUT /refunds/:id/status` |
| Docs | `POST /reservations/:id/voucher`, `POST /reservations/:id/proforma`, `POST /reservations/:id/documents` |
| Operations | `GET /departures/:dateId/pax-list`, `/rooming`, `/transfer`, `/passport`, `/hotel-allocation`, `/guide`, `/emergency` (`?format=xlsx|pdf`) |
| Accounting | `GET /reports/sales`, `/reports/revenue`, `/reports/outstanding`, `/reports/supplier-payments`, `/reports/commission` |
| B2B | `GET/POST /agencies`, `PUT /agencies/:id`, `POST /agencies/:id/balance`, `GET /agencies/:id/statement` |
| Content | `…/blog`, `…/faqs`, `…/campaigns`, `…/testimonials`, `…/pages`, `…/settings` |
| System | `GET /users`, `POST /users`, `PUT /roles`, `GET /audit-logs` |

### B2B (`/api/b2b/*`) — agency-scoped
`GET /catalog` (NET prices), `POST /reservations`, `GET /reservations`, `GET /reservations/:ref/voucher`, `GET /balance`, `GET /statement`, `GET /commission`.

### Webhooks / integrations (`/api/webhooks/*`)
`POST /payments/iyzico`, `POST /payments/stripe` (signature-verified), `POST /exchange-rate/refresh` (cron), `POST /holds/sweep` (cron releases expired holds), `GET /sitemap.xml`, `GET /robots.txt`.

**Response contract:** `{ data }` on success; `{ error: { code, message, fields? } }` on failure.
Money returned as `{ minor, currency, formatted }`. Pagination `{ items, page, pageSize, total }`.

---

## H. Frontend page structure (App Router)

```
app/
├─ (public)/
│  ├─ page.tsx                         /                      Homepage
│  ├─ turlar/page.tsx                  /turlar                Destination + all-tours hub
│  ├─ turlar/[destinationSlug]/page.tsx /turlar/misir-turlari Destination landing + filtered list
│  ├─ tur/[tourSlug]/page.tsx          /tur/...               Tour detail (ISR)
│  ├─ rezervasyon/[tourSlug]/page.tsx  /rezervasyon/...       Reservation wizard (steps 1–9)
│  ├─ rezervasyon/sonuc/[ref]/page.tsx                        Confirmation screen
│  ├─ rezervasyon-sorgula/page.tsx                            Lookup
│  ├─ blog/page.tsx · blog/[slug]/page.tsx                    Travel guide
│  ├─ hakkimizda · iletisim · sss                             About · Contact · FAQ
│  ├─ kosullar · gizlilik · iptal-iade                        Terms · Privacy/KVKK · Cancellation
│  └─ layout.tsx                       Header, MegaNav, Footer, WhatsApp FAB
├─ (account)/hesabim/...               Dashboard, reservations, documents, favorites, messages, profile
├─ (admin)/admin/...                   dashboard, tours, dates, reservations, operations,
│                                       accounting, b2b, content, users, audit, settings
├─ (b2b)/b2b/...                        catalog, reservations, balance, statement, commission
├─ api/...                             route handlers (section G)
├─ sitemap.ts · robots.ts · manifest.ts
└─ layout.tsx (root: fonts, theme, analytics, Toaster)
```

**URL ↔ slug map (SEO):** `/turlar/misir-turlari`, `/turlar/moskova-turlari`,
`/turlar/italya-turlari`, `/turlar/beneluks-turlari`, `/turlar/yunanistan-turlari`;
detail `/tur/misir-sharm-el-sheikh-5-gece`.

**Rendering:** homepage & destination pages = ISR (revalidate 1h + on-publish webhook);
tour detail = ISR (revalidate 10m, price grid hydrated client-side from `/quote` for freshness);
wizard, account, admin, b2b = dynamic + auth.

---

## I. Component list

**UI kit (`components/ui`)** — Button, IconButton, Input, Textarea, Select, Combobox,
DatePicker, DateRangePicker, NumberStepper, Checkbox, Radio, Switch, Badge, Tag, Card,
Modal/Dialog, Drawer, Tabs, Accordion, Tooltip, Toast, Skeleton, Spinner, Pagination,
Breadcrumbs, Avatar, Rating(stars), **Money** (formats minor→TRY), Table (sortable/filterable),
EmptyState, Alert, StatCard.

**Public** — `SiteHeader`, `MegaNavDestinations`, `Footer`, `WhatsAppFab`,
`HeroSearch` (destination/date/adults/children/price), `SearchBarCompact`,
`TourCard`, `TourCardGrid`, `DestinationCard`, `DestinationHero`,
`FilterSidebar` + `FilterChips` + `SortSelect`, `PriceFromBadge`, `AvailabilityBadge`,
`Gallery`/`Lightbox`, `ItineraryTimeline`, `IncludedExcludedList`, `HotelInfoCard`,
`TransportInfoCard`, `PriceTable` (date × room × pax), `DepartureDatePicker`,
`SimilarTours`, `Testimonials`, `CampaignBanner`, `TrustBadges`, `FaqAccordion`,
`ContactForm`, `NewsletterSignup`, `WhatsAppQuoteButton`.

**Reservation wizard (`components/booking`)** — `BookingWizard` (stepper shell + state),
`StepDate`, `StepPax`, `StepPassengers` (+ `PassengerCard`), `StepRoom` (`RoomTypeSelector`),
`StepExtras`, `StepReview` (`PriceBreakdown`), `StepPayment` (`PaymentMethodSelector`),
`HoldTimer`, `ConsentCheckboxes`, `ReservationSummaryAside`, `ConfirmationCard`.

**Account (`components/account`)** — `ReservationListItem`, `ReservationStatusBadge`,
`ReservationTimeline`, `DocumentUploader`, `PaymentStatusPanel`, `MessageThread`,
`FavoriteButton`, `ProfileForm`.

**Admin (`components/admin`)** — `AdminShell` (sidebar+topbar), `DataTable` (server-side
filter/sort/paginate, bulk actions, column visibility), `KpiCard`, `DashboardCharts`,
`LowQuotaAlertList`, `UpcomingDepartures`, `TourForm` (tabs: Genel, İçerik, Görseller,
Tarihler & Fiyatlar, Ekstralar, SEO, Şartlar), `ItineraryEditor`, `ImageManager`,
`TourDateEditor`, `PriceGridEditor` (date × room × pax matrix), `ReservationDetail`,
`StatusStepper` (allowed transitions only), `PaymentRecorder`, `RefundForm`,
`AssignAgentSelect`, `InternalNotes`, `VoucherPreview`, `ProformaPreview`,
`OperationListTable` + `ExportMenu`, `AccountingReportTable`, `AgencyForm`,
`BalanceLedger`, `CommissionTable`, `BlogEditor`(MDX/rich), `CampaignForm`,
`UserRoleManager`, `AuditLogTable`, `SettingsForm`.

**B2B (`components/b2b`)** — `B2bCatalogCard` (NET price + commission), `B2bBookingForm`,
`BalanceWidget`, `StatementTable`, `B2bReservationTable`.

**Domain layer (`lib/`, not React)** — `pricing/quote.ts`, `quota/holds.ts`,
`reservations/create.ts` + `statusMachine.ts`, `payments/{provider,record}.ts`,
`notifications/{send,templates}.ts`, `documents/{voucher,proforma,excel}.ts`,
`auth/rbac.ts`, `audit/log.ts`, `currency/rate.ts`, `seo/schema.ts`.
