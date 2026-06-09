# The database, in plain language

You don't need to be technical to understand how the data is organized. Think of the database as
a stack of **linked spreadsheets**. Each spreadsheet is a "table" (e.g. *Tours*, *Customers*).
Each row is one record (one tour, one customer). Tables link to each other by an **ID** — the way
a reservation "knows" which customer it belongs to.

Two conventions worth knowing:
- **Money is stored as whole numbers** (kuruş/cents), not decimals — so prices never round wrong. ₺38.430 is stored as `3843000`.
- Tour prices are kept in **EUR**, and each reservation freezes the **EUR→TRY rate** at the moment of booking, so a later currency swing never changes an old order.

---

## The big picture — the "spine" of a booking

```
WHAT we sell        WHEN & how much        WHO books          THE BOOKING        THE MONEY
Destinations  →  Tours  →  Departures + Prices  →  Customer  →  Reservation  →  Payments
```

Everything else (operations lists, CRM, B2B, the website CMS) hangs off this spine.

---

## The areas (and how they connect)

**1. Catalog — what we sell**
*Destinations* (Mısır, İtalya…) each **have many** *Tours*. A *Tour* **has** a day-by-day *Itinerary*, *Images*, and *FAQs*.

**2. Inventory — when, and for how much**
A *Tour* **has many** *Departure Dates* (e.g. "12–17 July, 40 seats"). Each date **has** a *Price grid* — a price for every combination of **date × room type (single/double…) × traveler type (adult/child/infant)**, plus early-bird and single-supplement. *Optional Extras* (insurance, visa) live here too. Each date also tracks **seats sold vs. quota**, which is how overbooking is prevented.

**3. People — the CRM**
*Customers* are the contact records (created automatically when someone books). *Leads* are enquiries from the contact form. A sales *Pipeline* (stages like "Quote sent → Won") tracks deals before they become bookings.

**4. The booking itself**
A *Reservation* ties one **customer** to one **departure date**, and **has many** *Passengers* and *Extras*. It carries the status (New → Waiting payment → Confirmed → …) and the money totals (total / paid / balance).

**5. Money**
*Payments* and *Refunds* attach to a reservation; the reservation's *paid* and *balance* update automatically. *Commissions* track what partner agencies earn.

**6. Suppliers & operations**
*Suppliers*, *Hotels*, and *Transports* are the behind-the-scenes vendors. From a departure's passengers the system generates rooming/passport/transfer lists.

**7. B2B**
*Agencies* (partner sub-agencies) **have** their own *users*, see net prices, and carry a balance.

**8. Website content (CMS)**
*Pages* are built from **blocks** (hero, tour-grid, text…). *Menus* drive the site's header/footer. *Media* is the uploaded-image library. Plus *Blog posts* and *FAQs*.

**9. System**
*Users* + *Roles* (who can log into the admin and what they can do), *Audit Logs* (who changed what), *Notifications* (the email outbox), and *Settings*.

---

## Follow one real booking through the tables

> Ayşe books "Sharm El Sheikh 5 Gece" for 12 July, 2 adults + 1 child.

1. A **Customer** row is created for Ayşe (if she's new).
2. A **Reservation** row links her to that **Departure Date**, with a unique reference (`TA-7H2K9M`).
3. Three **Passenger** rows are added (Ayşe + 2).
4. The **Departure Date's** "seats sold" goes up by 3 — done in a way that two people booking the last seats at once can't both succeed.
5. When she pays, a **Payment** row is added and the reservation's *balance* drops to ₺0; status moves to *Confirmed*.
6. A **Notification** row records that her confirmation email went out.
7. For the trip, the **Passengers** feed the operations **rooming / passport** lists.

That's the whole journey — every step is just rows being added to linked tables.

---

*The full technical schema (all ~60 tables, fields, indexes, relationships) is in
[`docs/03-database-schema.md`](03-database-schema.md) and the executable
[`prisma/schema.prisma`](../prisma/schema.prisma).*
