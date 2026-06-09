# 03 — Database Schema (F)

PostgreSQL 16 · Prisma. Executable version: [`prisma/schema.prisma`](../prisma/schema.prisma).
Conventions: PK `id cuid`; every table has `createdAt`, `updatedAt`; soft-delete `deletedAt?`
where noted; money = **integer minor units** + `currency` (ISO-4217); slugs unique & indexed.

## Domain map
```
auth:        users ─ roles ─ permissions (role_permissions, user_roles)
crm:         customers ─ documents ─ messages ─ leads ─ favorites
catalog:     destinations ─ tours ─ tour_images ─ tour_itinerary_days ─ faqs(tour) ─ campaigns
inventory:   tour_dates ─ tour_prices ─ room_types ─ optional_extras
booking:     reservations ─ reservation_passengers ─ reservation_extras ─ seat_holds
money:       payments ─ refunds ─ commissions
supply:      suppliers ─ hotels ─ transports ─ tour_date_allocations
b2b:         agencies ─ agency_users
content:     blog_posts ─ pages ─ testimonials ─ faqs(general)
system:      settings ─ audit_logs ─ notifications ─ notification_templates
```

---

## Enums
```
UserRealm        = CUSTOMER | STAFF | B2B
StaffRole        = SUPER_ADMIN | SALES_AGENT | OPERATIONS | ACCOUNTING | CONTENT_EDITOR
TourStatus       = DRAFT | PUBLISHED | HIDDEN | ARCHIVED
TourDateStatus   = ACTIVE | FULL | CLOSED | CANCELLED
TransportType    = FLIGHT | BUS | CRUISE | OWN_ARRANGEMENT | MIXED
HotelCategory    = THREE_STAR | FOUR_STAR | FIVE_STAR | BOUTIQUE | NONE
PaxType          = ADULT | CHILD_WITH_BED | CHILD_NO_BED | INFANT
RoomOccupancy    = SINGLE | DOUBLE | TRIPLE | QUAD | FAMILY
ReservationStatus= NEW_REQUEST | WAITING_PAYMENT | PAYMENT_RECEIVED | CONFIRMED
                 | WAITING_SUPPLIER | CANCELLED | REFUNDED | COMPLETED
PaymentMethod    = CREDIT_CARD | BANK_TRANSFER | CASH | AGENCY_CREDIT | PARTIAL
PaymentStatus    = PENDING | SUCCEEDED | FAILED | REFUNDED | PARTIALLY_REFUNDED
RefundStatus     = REQUESTED | APPROVED | PROCESSED | REJECTED
ChannelType      = DIRECT_WEB | ADMIN | B2B | PHONE | WHATSAPP
SupplierType     = HOTEL | DMC | AIRLINE | TRANSFER | GUIDE | INSURANCE | OTHER
DocumentType     = PASSPORT | ID_CARD | VISA | VOUCHER | INVOICE | PROFORMA | CONTRACT | OTHER
MessageChannel   = WEB | EMAIL | WHATSAPP | PHONE | SMS
NotificationType = RES_NEW | RES_CONFIRMED | PAYMENT_RECEIVED | DOC_MISSING | TOUR_REMINDER
                 | CANCELLATION | LOW_QUOTA | ADMIN_ALERT
AgencyStatus     = PENDING | ACTIVE | SUSPENDED
CommissionStatus = ACCRUED | INVOICED | PAID | CANCELLED
```

---

## Tables

### auth
**users** — login identity for all realms.
`id, email�︎uniq, phone, passwordHash, realm:UserRealm, firstName, lastName, locale='tr',
emailVerifiedAt?, twoFactorSecret?, lastLoginAt?, isActive=true, agencyId?→agencies,
customerId?→customers, createdAt, updatedAt, deletedAt?`
idx: `(realm)`, `(agencyId)`, `(customerId)`.

**roles** — `id, key�︎uniq, name, realm:UserRealm, isSystem`
**permissions** — `id, key�︎uniq (e.g. reservation:create), description`
**role_permissions** — `roleId→roles, permissionId→permissions` (PK both)
**user_roles** — `userId→users, roleId→roles` (PK both)

### crm
**customers** — end customers (may exist without a login, created at booking).
`id, userId?→users, firstName, lastName, email, phone, nationality?, birthDate?,
city?, marketingConsent=false, kvkkConsentAt?, notes?(staff), source:ChannelType, createdAt…`
idx: `(email)`, `(phone)`.

**favorites** — `id, customerId→customers, tourId→tours, createdAt` uniq`(customerId,tourId)`
**leads** — pre-booking enquiries. `id, name, email, phone, destinationId?, tourId?, message,
channel:ChannelType, status(NEW|CONTACTED|CONVERTED|LOST), assignedToId?→users, createdAt`
**documents** — uploaded files (private bucket). `id, type:DocumentType, fileKey, fileName,
mimeType, sizeBytes, reservationId?→reservations, passengerId?→reservation_passengers,
customerId?→customers, uploadedById?→users, isSensitive=false, createdAt` idx`(reservationId)`
**messages** — threaded customer⇄agency. `id, reservationId?→reservations, customerId?→customers,
agencyId?→agencies, senderUserId?→users, channel:MessageChannel, direction(IN|OUT),
subject?, body, isRead=false, createdAt` idx`(reservationId)`,`(customerId)`

### catalog
**destinations** — `id, slug�︎uniq, nameTr, nameEn?, country, heroImageKey?, summaryTr?,
descriptionTr?, seoTitle?, seoDescription?, isFeatured=false, sortOrder=0, isActive=true,
createdAt…` idx`(slug)`,`(isFeatured)`
**tours** — `id, destinationId→destinations, slug�︎uniq, titleTr, summaryTr, descriptionTr(rich),
durationDays, durationNights, transportType:TransportType, hotelCategory:HotelCategory,
visaRequired=false, isGuided=true, hasFreeTime=true, basePriceMinor, baseCurrency='EUR',
status:TourStatus=DRAFT, isFeatured=false, isCampaign=false, ratingAvg?, ratingCount=0,
includedServices Json, excludedServices Json, meetingPoint?, visaNotes?, cancellationPolicy?,
reservationTerms?, seoTitle?, seoDescription?, supplierId?→suppliers, publishedAt?,
createdAt, updatedAt, deletedAt?` idx`(destinationId)`,`(slug)`,`(status)`,`(isFeatured)`,`(isCampaign)`
**tour_images** — `id, tourId→tours, fileKey, alt, sortOrder=0, isCover=false`
**tour_itinerary_days** — `id, tourId→tours, dayNumber, titleTr, descriptionTr, mealsJson?(B/L/D),
overnightCity?` uniq`(tourId,dayNumber)`
**faqs** — general or per-tour. `id, tourId?→tours, questionTr, answerTr, sortOrder=0, isPublished=true`
**campaigns** — `id, code�︎uniq, nameTr, kind(EARLY_BIRD|LAST_MINUTE|PROMO), percentOff?,
amountOffMinor?, startsAt, endsAt, isActive, appliesToTourId?→tours, appliesToDestinationId?`

### inventory
**room_types** — catalog. `id, code(DBL|SGL|TRP|FAM)⫶, nameTr, occupancy:RoomOccupancy,
maxAdults, maxChildren, sortOrder` (global; usable across tours)
**tour_dates** — a departure. **Core inventory row.**
`id, tourId→tours, startDate, endDate, quota, seatsSold=0, seatsHeld=0,
status:TourDateStatus=ACTIVE, baseCurrency='EUR', earlyBirdUntil?, lastMinuteFrom?,
flightNotes?, transportNotes?, supplierConfirmed=false, supplierRef?, cutoffDate?,
createdAt…` idx`(tourId,startDate)`,`(status)`. **Invariant:** `seatsSold + seatsHeld ≤ quota`.
Derived: `remainingSeats = quota − seatsSold − seatsHeld`.
**tour_prices** — price grid per departure × room type × pax type.
`id, tourDateId→tour_dates, roomTypeId→room_types, paxType:PaxType, priceMinor, currency,
earlyBirdPriceMinor?, lastMinutePriceMinor?, childMinAge?, childMaxAge?`
uniq`(tourDateId,roomTypeId,paxType)` idx`(tourDateId)`. Single-supplement = SGL room row.
**optional_extras** — `id, tourId?→tours (null=global), nameTr, descriptionTr?, priceMinor,
currency, perPax=true, isActive=true` (e.g. vize, seyahat sigortası, ekstra tur)

### booking
**seat_holds** — soft locks during the wizard. `id, tourDateId→tour_dates, seats,
sessionToken, reservationId?→reservations, expiresAt, createdAt` idx`(tourDateId)`,`(expiresAt)`
**reservations** — `id, reference⫶uniq (e.g. TA-2K7F9Q), customerId→customers,
tourId→tours, tourDateId→tour_dates, agencyId?→agencies (B2B), channel:ChannelType,
status:ReservationStatus=NEW_REQUEST, assignedToId?→users,
adults, children, infants,
currency='TRY', exchangeRate (EUR→TRY snapshot, decimal), exchangeRateAt,
subtotalMinor, extrasMinor, discountMinor, totalMinor, paidMinor=0, balanceMinor,
campaignId?→campaigns, paymentMethod?:PaymentMethod,
notesInternal?, cancellationReason?, cancelledAt?, completedAt?,
createdAt, updatedAt` idx`(status)`,`(tourDateId)`,`(customerId)`,`(agencyId)`,`(reference)`,`(assignedToId)`
**reservation_passengers** — `id, reservationId→reservations, paxType:PaxType, isLead=false,
firstName, lastName, birthDate?, nationality?, passportNo?(enc), passportExpiry?,
phone?, email?, roomTypeId?→room_types, roomGroup?(int, who shares a room),
specialRequests?, emergencyName?, emergencyPhone?` idx`(reservationId)`
**reservation_extras** — `id, reservationId→reservations, optionalExtraId→optional_extras,
quantity, unitPriceMinor, currency` 

### money
**payments** — `id, reservationId→reservations, method:PaymentMethod, status:PaymentStatus,
amountMinor, currency, provider?(iyzico|stripe|manual), providerRef?, paidAt?,
recordedById?→users, receiptDocumentId?→documents, note?, createdAt` idx`(reservationId)`,`(status)`
**refunds** — `id, reservationId→reservations, paymentId?→payments, amountMinor, currency,
status:RefundStatus=REQUESTED, reason?, requestedById?→users, approvedById?→users,
processedAt?, createdAt` idx`(reservationId)`
**commissions** — B2B/agent earnings. `id, reservationId→reservations, agencyId?→agencies,
basisMinor, percent, amountMinor, currency, status:CommissionStatus=ACCRUED, settledAt?`
idx`(agencyId,status)`

### supply
**suppliers** — `id, type:SupplierType, name, contactName?, email?, phone?, country?,
defaultCurrency?, notes?, isActive=true` 
**hotels** — `id, supplierId?→suppliers, name, city, country, category:HotelCategory,
address?, phone?, notes?` 
**transports** — `id, supplierId?→suppliers, type:TransportType, name(carrier/route),
depAirport?, arrAirport?, notes?` 
**tour_date_allocations** — what a departure uses. `id, tourDateId→tour_dates, hotelId?→hotels,
transportId?→transports, roomsBlocked?, seatsBlocked?, costMinor?, currency?, confirmed=false,
supplierRef?`

### b2b
**agencies** — `id, name, slug⫶uniq, contactName, email, phone, taxNo?, address?,
status:AgencyStatus=PENDING, pricingTier(STANDARD|GOLD|NET), commissionPercent,
creditLimitMinor=0, balanceMinor=0 (negative = owes us), currency='TRY', createdAt…`
**agency_users** — convenience link (also via users.agencyId). `id, agencyId→agencies,
userId→users, isOwner=false` uniq`(agencyId,userId)`

### content
**blog_posts** — `id, slug⫶uniq, titleTr, excerptTr?, bodyTr(rich), coverImageKey?,
destinationId?→destinations, authorId?→users, status(DRAFT|PUBLISHED), publishedAt?,
seoTitle?, seoDescription?, tags Json?` idx`(slug)`,`(status)`
**pages** — legal/static. `id, slug⫶uniq (terms|privacy|cancellation|about), titleTr, bodyTr,
seoTitle?, seoDescription?, updatedAt`
**testimonials** — `id, customerName, avatarKey?, tourId?→tours, rating(1-5), bodyTr,
isPublished=true, sortOrder=0`

### system
**settings** — singleton-ish key/value. `id, key⫶uniq, valueJson, group(payments|email|seo|
general|integrations), updatedById?→users, updatedAt`
**notification_templates** — `id, type:NotificationType, channel(EMAIL|SMS|WHATSAPP),
locale, subject?, body(handlebars), isActive=true` uniq`(type,channel,locale)`
**notifications** — outbox/log. `id, type:NotificationType, channel, toEmail?/toPhone?,
reservationId?→reservations, userId?→users, payload Json, status(QUEUED|SENT|FAILED),
sentAt?, error?, createdAt` idx`(status)`,`(reservationId)`
**audit_logs** — `id, actorUserId?→users, actorRealm:UserRealm, action(e.g. reservation.status.update),
entity(reservation|tour|payment…), entityId, before Json?, after Json?, ip?, userAgent?,
createdAt` idx`(entity,entityId)`,`(actorUserId)`,`(createdAt)`

---

## Key relationships & integrity rules
- `tour_dates.seatsSold/seatsHeld` mutated **only** inside transactions by the quota service (doc 05). DB check: `seatsSold + seatsHeld <= quota`.
- `reservations.balanceMinor = totalMinor − paidMinor` kept in sync on every payment/refund (and re-derivable).
- Deleting a `tour` is soft (`deletedAt`); a tour with reservations can't be hard-deleted.
- `reservation_passengers.passportNo` stored **encrypted** (app-layer AES-GCM); excluded from default selects (doc 06).
- `agencies.balanceMinor` adjusted by B2B payments/commission within transactions; statement = ledger of `payments` + `commissions` + manual adjustments.
- Polymorphic-ish `documents`/`audit_logs` use nullable typed FKs (Prisma-friendly) rather than generic morphs.

## Indexing & performance notes
- Catalog reads (listing/detail) hit `tours(status, destinationId)`, `tour_dates(tourId, startDate, status)`, `tour_prices(tourDateId)` — covered by indexes above; tour detail is ISR-cached.
- Admin reservation grid filters on `reservations(status, tourDateId, agencyId, assignedToId)` — composite index `(status, createdAt)` for the default sorted view.
- `seat_holds(expiresAt)` swept by a cron job releasing expired holds (decrement `seatsHeld`).
- Full-text search (tour title/summary/destination) via Postgres `tsvector` GIN index on a generated `searchVector` column.
