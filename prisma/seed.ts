import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const E = (eur: number) => Math.round(eur * 100); // euros → minor (cents)
const TRY = (eur: number) => Math.round(eur * 100 * 35); // eur → TRY minor @ demo rate
const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

type DateCfg = {
  start: string;
  end: string;
  quota: number;
  sold?: number;
  adult: number; // EUR, adult in DBL
  single: number; // EUR, single supplement
  early?: number; // EUR, early-bird adult DBL
  earlyUntil?: string;
};

async function wipe() {
  // child → parent order
  await db.notification.deleteMany();
  await db.payment.deleteMany();
  await db.reservationExtra.deleteMany();
  await db.reservationPassenger.deleteMany();
  await db.crmActivity.deleteMany();
  await db.crmOpportunity.deleteMany();
  await db.commission.deleteMany();
  await db.reservation.deleteMany();
  await db.tourPrice.deleteMany();
  await db.tourDate.deleteMany();
  await db.tourItineraryDay.deleteMany();
  await db.faq.deleteMany();
  await db.optionalExtra.deleteMany();
  await db.testimonial.deleteMany();
  await db.tour.deleteMany();
  await db.destination.deleteMany();
  await db.roomType.deleteMany();
  await db.menuItem.deleteMany();
  await db.menu.deleteMany();
  await db.page.deleteMany();
  await db.crmStage.deleteMany();
  await db.crmPipeline.deleteMany();
  await db.agencyUser.deleteMany();
  await db.agency.deleteMany();
  await db.customer.deleteMany();
  await db.userRole.deleteMany();
  await db.user.deleteMany();
  await db.role.deleteMany();
}

async function main() {
  await wipe();

  // ── room types ────────────────────────────────────────────────
  const roomDefs = [
    { code: "SGL", nameTr: "Tek Kişilik Oda", occupancy: "SINGLE", maxAdults: 1, maxChildren: 0, sortOrder: 1 },
    { code: "DBL", nameTr: "İki Kişilik Oda", occupancy: "DOUBLE", maxAdults: 2, maxChildren: 1, sortOrder: 2 },
    { code: "TRP", nameTr: "Üç Kişilik Oda", occupancy: "TRIPLE", maxAdults: 3, maxChildren: 1, sortOrder: 3 },
    { code: "FAM", nameTr: "Aile Odası", occupancy: "FAMILY", maxAdults: 2, maxChildren: 2, sortOrder: 4 },
  ] as const;
  const rooms: Record<string, string> = {};
  for (const r of roomDefs) {
    const created = await db.roomType.create({ data: r as any });
    rooms[r.code] = created.id;
  }

  // ── global extras ─────────────────────────────────────────────
  const extraDefs = [
    { nameTr: "Seyahat Sağlık Sigortası", priceMinor: E(25), perPax: true },
    { nameTr: "Vize Hizmet Bedeli", priceMinor: E(60), perPax: true },
    { nameTr: "Ekstra Tur Paketi", priceMinor: E(90), perPax: true },
    { nameTr: "Havalimanı Özel Transfer", priceMinor: E(40), perPax: false },
    { nameTr: "Tekne / Yat Turu", priceMinor: E(55), perPax: true },
  ];
  const extras = [];
  for (const e of extraDefs)
    extras.push(await db.optionalExtra.create({ data: { ...e, currency: "EUR" } }));

  // ── destinations ──────────────────────────────────────────────
  const destDefs = [
    { slug: "misir-turlari", nameTr: "Mısır Turları", nameEn: "Egypt", country: "Mısır", sortOrder: 1, summaryTr: "Kızıldeniz’in turkuaz koyları, piramitler ve Nil’in büyüsü.", seoTitle: "Mısır Turları 2026 | Sharm El Sheikh & Kahire", seoDescription: "Uçak dahil her şey dahil Mısır turları. Sharm El Sheikh, Hurghada ve Kahire-Nil gemi turları." },
    { slug: "moskova-turlari", nameTr: "Rusya Moskova Turları", nameEn: "Russia", country: "Rusya", sortOrder: 2, summaryTr: "Kızıl Meydan, Kremlin ve görkemli metro istasyonları.", seoTitle: "Moskova Turları 2026 | Rusya Tur Fiyatları", seoDescription: "Moskova ve St. Petersburg turları. Uçak, otel, rehber dahil paketler." },
    { slug: "italya-turlari", nameTr: "İtalya Turları", nameEn: "Italy", country: "İtalya", sortOrder: 3, summaryTr: "Roma, Floransa, Venedik — sanatın ve lezzetin başkentleri.", seoTitle: "İtalya Turları 2026 | Klasik İtalya & Roma", seoDescription: "Klasik İtalya turları: Roma, Floransa, Venedik. Vizesiz Schengen turları." },
    { slug: "beneluks-turlari", nameTr: "Benelüks Turları", nameEn: "Benelux", country: "Belçika / Hollanda / Lüksemburg", sortOrder: 4, summaryTr: "Brüksel, Amsterdam ve Lüksemburg’u tek turda keşfedin.", seoTitle: "Benelüks Turları 2026 | Brüksel Amsterdam", seoDescription: "Benelüks turu: Brüksel, Bruges, Amsterdam, Lahey, Lüksemburg." },
    { slug: "yunanistan-turlari", nameTr: "Yunanistan Turları", nameEn: "Greece", country: "Yunanistan", sortOrder: 5, summaryTr: "Akropolis’ten ada cennetlerine antik ve mavi bir yolculuk.", seoTitle: "Yunanistan Turları 2026 | Atina & Yunan Adaları", seoDescription: "Atina şehir turları ve Yunan adaları tatil paketleri." },
  ];
  const dest: Record<string, string> = {};
  for (const dd of destDefs) {
    const created = await db.destination.create({
      data: { ...dd, isFeatured: true, isActive: true },
    });
    dest[dd.slug] = created.id;
  }

  // ── tour factory ──────────────────────────────────────────────
  function priceSet(tourDateId: string, roomTypeId: string, adultEur: number, childBaseEur: number, earlyEur?: number) {
    return [
      { tourDateId, roomTypeId, paxType: "ADULT" as const, priceMinor: E(adultEur), currency: "EUR", earlyBirdPriceMinor: earlyEur ? E(earlyEur) : null },
      { tourDateId, roomTypeId, paxType: "CHILD_WITH_BED" as const, priceMinor: E(Math.round(childBaseEur * 0.72)), currency: "EUR" },
      { tourDateId, roomTypeId, paxType: "INFANT" as const, priceMinor: E(75), currency: "EUR" },
    ];
  }

  async function createTour(
    t: {
      destSlug: string;
      slug: string;
      titleTr: string;
      summaryTr: string;
      descriptionTr: string;
      days: number;
      nights: number;
      transport: string;
      hotel: string;
      visa: boolean;
      basePriceEur: number;
      featured?: boolean;
      campaign?: boolean;
      rating?: number;
      included: string[];
      excluded: string[];
      itinerary: { title: string; desc: string; city?: string }[];
      faqs: { q: string; a: string }[];
    },
    dates: DateCfg[],
  ) {
    const tour = await db.tour.create({
      data: {
        destinationId: dest[t.destSlug],
        slug: t.slug,
        titleTr: t.titleTr,
        summaryTr: t.summaryTr,
        descriptionTr: t.descriptionTr,
        durationDays: t.days,
        durationNights: t.nights,
        transportType: t.transport as any,
        hotelCategory: t.hotel as any,
        visaRequired: t.visa,
        basePriceMinor: E(t.basePriceEur),
        baseCurrency: "EUR",
        status: "PUBLISHED",
        isFeatured: t.featured ?? false,
        isCampaign: t.campaign ?? false,
        ratingAvg: t.rating ?? 4.7,
        ratingCount: Math.floor(40 + Math.random() * 120),
        includedServices: t.included,
        excludedServices: t.excluded,
        meetingPoint: "İstanbul Havalimanı, Dış Hatlar Gidiş Katı",
        visaNotes: t.visa ? "Bu tur için vize gereklidir. Vize hizmeti opsiyonel olarak eklenebilir." : "Schengen vizesi gereklidir (mevcut vizeyle katılım mümkündür).",
        cancellationPolicy: "30 günden önce %10, 15-30 gün arası %50, 15 günden az %100 iptal bedeli uygulanır.",
        reservationTerms: "Rezervasyon, kapora veya tam ödeme ile kesinleşir.",
        seoTitle: `${t.titleTr} | Tur Acente`,
        seoDescription: t.summaryTr,
        publishedAt: new Date(),
        itineraryDays: {
          create: t.itinerary.map((it, i) => ({
            dayNumber: i + 1,
            titleTr: it.title,
            descriptionTr: it.desc,
            overnightCity: it.city ?? null,
          })),
        },
        faqs: { create: t.faqs.map((f, i) => ({ questionTr: f.q, answerTr: f.a, sortOrder: i })) },
      },
    });

    for (const dc of dates) {
      const sold = dc.sold ?? 0;
      const td = await db.tourDate.create({
        data: {
          tourId: tour.id,
          startDate: day(dc.start),
          endDate: day(dc.end),
          quota: dc.quota,
          seatsSold: sold,
          status: sold >= dc.quota ? "FULL" : "ACTIVE",
          baseCurrency: "EUR",
          earlyBirdUntil: dc.earlyUntil ? day(dc.earlyUntil) : null,
          supplierConfirmed: Math.random() > 0.5,
        },
      });
      await db.tourPrice.createMany({
        data: [
          ...priceSet(td.id, rooms.DBL, dc.adult, dc.adult, dc.early),
          ...priceSet(td.id, rooms.SGL, dc.adult + dc.single, dc.adult, dc.early ? dc.early + dc.single : undefined),
        ],
      });
    }
    return tour;
  }

  // ── tours ─────────────────────────────────────────────────────
  await createTour(
    {
      destSlug: "misir-turlari",
      slug: "misir-sharm-el-sheikh-5-gece",
      titleTr: "Sharm El Sheikh 5 Gece Her Şey Dahil",
      summaryTr: "Kızıldeniz kıyısında 5 yıldızlı ultra her şey dahil konaklama, dalış ve çöl safarisi.",
      descriptionTr: "Türkiye’den direkt uçuşla Kızıldeniz’in incisi Sharm El Sheikh’e. 5 gece ultra her şey dahil 5 yıldızlı otelde konaklama, muhteşem mercan resifleri, Naama Bay’in canlı atmosferi ve opsiyonel çöl safarisi ile unutulmaz bir tatil.",
      days: 6, nights: 5, transport: "FLIGHT", hotel: "FIVE_STAR", visa: true, basePriceEur: 549,
      featured: true, campaign: true, rating: 4.8,
      included: ["Gidiş-dönüş uçak bileti", "5 gece ultra her şey dahil 5* otel", "Havalimanı transferleri", "Profesyonel rehberlik hizmeti"],
      excluded: ["Vize (kapıda ~25 USD)", "Öğle yemeği turları", "Kişisel harcamalar", "Opsiyonel ekstra turlar"],
      itinerary: [
        { title: "İstanbul – Sharm El Sheikh", desc: "Havalimanında buluşma, uçuş ve otele yerleşme. Akşam serbest zaman.", city: "Sharm El Sheikh" },
        { title: "Serbest Gün / Plaj", desc: "Otelin Kızıldeniz plajında dinlenme veya şnorkelle keşif.", city: "Sharm El Sheikh" },
        { title: "Ras Muhammed Dalış Turu (Opsiyonel)", desc: "Dünyaca ünlü mercan resiflerinde dalış ve şnorkel.", city: "Sharm El Sheikh" },
        { title: "Çöl Safari (Opsiyonel)", desc: "ATV ile çöl safarisi, Bedevi köyü ve yıldız altında akşam yemeği.", city: "Sharm El Sheikh" },
        { title: "Naama Bay", desc: "Alışveriş, kafeler ve serbest zaman.", city: "Sharm El Sheikh" },
        { title: "Sharm El Sheikh – İstanbul", desc: "Otelden çıkış ve dönüş uçuşu." },
      ],
      faqs: [
        { q: "Vize gerekli mi?", a: "Sharm El Sheikh için kapıda vize alınabilir (yaklaşık 25 USD). Vize hizmetini rezervasyonda opsiyonel ekleyebilirsiniz." },
        { q: "Otel her şey dahil mi?", a: "Evet, 5 yıldızlı otelde ultra her şey dahil konsept sunulmaktadır." },
      ],
    },
    [
      { start: "2026-07-12", end: "2026-07-17", quota: 40, sold: 36, adult: 599, single: 160, early: 549, earlyUntil: "2026-06-20" },
      { start: "2026-08-09", end: "2026-08-14", quota: 40, sold: 12, adult: 649, single: 180 },
      { start: "2026-09-13", end: "2026-09-18", quota: 30, sold: 5, adult: 549, single: 150, early: 499, earlyUntil: "2026-08-01" },
    ],
  );

  await createTour(
    {
      destSlug: "misir-turlari",
      slug: "misir-kahire-nil-7-gece",
      titleTr: "Kahire & Nil Nehri Gemi Turu",
      summaryTr: "Piramitler, Luxor, Asuan ve Nil üzerinde tam pansiyon gemi konaklaması.",
      descriptionTr: "Antik Mısır’ın kalbine yolculuk: Giza piramitleri, Sfenks, Mısır Müzesi, ardından Luxor ve Asuan’ı kapsayan Nil nehri gemi turu. Tarihin en görkemli anıtları arasında tam pansiyon bir deneyim.",
      days: 8, nights: 7, transport: "MIXED", hotel: "FIVE_STAR", visa: true, basePriceEur: 899,
      featured: true, rating: 4.9,
      included: ["Gidiş-dönüş uçak + iç hat uçuşlar", "5* otel + 4 gece Nil gemisi (tam pansiyon)", "Tüm transferler", "Türkçe rehber"],
      excluded: ["Vize", "Giriş ücretleri (opsiyonel paket)", "İçecekler", "Bahşişler"],
      itinerary: [
        { title: "İstanbul – Kahire", desc: "Uçuş ve otele yerleşme.", city: "Kahire" },
        { title: "Giza Piramitleri & Sfenks", desc: "Piramitler, Sfenks ve Mısır Müzesi.", city: "Kahire" },
        { title: "Kahire – Luxor", desc: "İç hat uçuş, gemiye giriş, Karnak Tapınağı.", city: "Luxor" },
        { title: "Krallar Vadisi", desc: "Krallar Vadisi ve Hatshepsut Tapınağı.", city: "Luxor" },
        { title: "Edfu & Kom Ombo", desc: "Nil boyunca tapınak ziyaretleri.", city: "Kom Ombo" },
        { title: "Asuan", desc: "Asuan Barajı, Philae Tapınağı.", city: "Asuan" },
        { title: "Asuan – Kahire", desc: "Dönüş uçuşu, serbest zaman.", city: "Kahire" },
        { title: "Kahire – İstanbul", desc: "Dönüş uçuşu." },
      ],
      faqs: [
        { q: "Gemi konaklaması nasıl?", a: "5 yıldızlı yüzen otel konforunda, tam pansiyon (kahvaltı-öğle-akşam) konaklama sunulur." },
        { q: "İç hat uçuşları dahil mi?", a: "Evet, Kahire-Luxor ve Asuan-Kahire iç hat uçuşları pakete dahildir." },
      ],
    },
    [
      { start: "2026-10-04", end: "2026-10-11", quota: 30, sold: 8, adult: 899, single: 280 },
      { start: "2026-11-08", end: "2026-11-15", quota: 30, sold: 3, adult: 949, single: 300 },
    ],
  );

  await createTour(
    {
      destSlug: "moskova-turlari",
      slug: "moskova-3-gece",
      titleTr: "Moskova 3 Gece Şehir Turu",
      summaryTr: "Kızıl Meydan, Kremlin ve dünyaca ünlü metro istasyonları rehber eşliğinde.",
      descriptionTr: "Rusya’nın görkemli başkenti Moskova’da 3 gece. Kızıl Meydan, Aziz Vasil Katedrali, Kremlin, GUM ve sanat eseri gibi metro istasyonlarını kapsayan rehberli şehir turu.",
      days: 4, nights: 3, transport: "FLIGHT", hotel: "FOUR_STAR", visa: false, basePriceEur: 499,
      featured: true, rating: 4.6,
      included: ["Gidiş-dönüş uçak", "3 gece 4* otel + kahvaltı", "Rehberli şehir turu", "Transferler"],
      excluded: ["e-Visa", "Öğle ve akşam yemekleri", "Müze giriş ücretleri"],
      itinerary: [
        { title: "İstanbul – Moskova", desc: "Uçuş, otele yerleşme, serbest akşam.", city: "Moskova" },
        { title: "Kızıl Meydan & Kremlin", desc: "Kızıl Meydan, Aziz Vasil, Kremlin dış turu, GUM.", city: "Moskova" },
        { title: "Metro & Arbat", desc: "Ünlü metro istasyonları ve Arbat Caddesi.", city: "Moskova" },
        { title: "Moskova – İstanbul", desc: "Serbest zaman ve dönüş." },
      ],
      faqs: [
        { q: "Vize gerekiyor mu?", a: "Türk vatandaşları için kolay e-visa uygulanır; başvuruda yardımcı oluyoruz." },
        { q: "Hangi havayolu?", a: "Tarifeli direkt uçuşlar kullanılır." },
      ],
    },
    [
      { start: "2026-09-25", end: "2026-09-28", quota: 30, sold: 10, adult: 549, single: 130 },
      { start: "2026-10-29", end: "2026-11-01", quota: 30, sold: 4, adult: 499, single: 120 },
    ],
  );

  await createTour(
    {
      destSlug: "italya-turlari",
      slug: "klasik-italya-7-gece",
      titleTr: "Klasik İtalya: Roma · Floransa · Venedik",
      summaryTr: "Üç efsane şehir, rehberli turlar ve İtalyan mutfağının kalbinde 7 gece.",
      descriptionTr: "İtalya’nın üç başyapıt şehri tek turda: Roma’nın antik görkemi, Floransa’nın Rönesans sanatı ve Venedik’in kanalları. Rehberli şehir turları ve serbest zamanlarla dengeli bir program.",
      days: 8, nights: 7, transport: "MIXED", hotel: "FOUR_STAR", visa: true, basePriceEur: 999,
      featured: true, campaign: true, rating: 4.8,
      included: ["Gidiş-dönüş uçak", "7 gece 4* otel + kahvaltı", "Şehirlerarası ulaşım", "Rehberli şehir turları"],
      excluded: ["Schengen vizesi", "Müze & Vatikan giriş ücretleri", "Öğle/akşam yemekleri"],
      itinerary: [
        { title: "İstanbul – Roma", desc: "Uçuş, otele yerleşme.", city: "Roma" },
        { title: "Antik Roma", desc: "Kolezyum, Roma Forumu, Trevi Çeşmesi, İspanyol Merdivenleri.", city: "Roma" },
        { title: "Vatikan", desc: "Vatikan Müzeleri ve St. Peter Bazilikası (opsiyonel).", city: "Roma" },
        { title: "Roma – Floransa", desc: "Hızlı tren, Floransa şehir turu.", city: "Floransa" },
        { title: "Floransa & Pisa", desc: "Duomo, Ponte Vecchio; opsiyonel Pisa turu.", city: "Floransa" },
        { title: "Floransa – Venedik", desc: "Venedik’e geçiş, San Marco Meydanı.", city: "Venedik" },
        { title: "Venedik", desc: "Gondol turu (opsiyonel), kanallar ve adalar.", city: "Venedik" },
        { title: "Venedik – İstanbul", desc: "Dönüş uçuşu." },
      ],
      faqs: [
        { q: "Şehirlerarası ulaşım nasıl?", a: "Hızlı tren ve özel otobüs transferleri kullanılır." },
        { q: "Vize için destek var mı?", a: "Schengen vize başvuru sürecinde dosya hazırlığı konusunda destek sağlıyoruz." },
      ],
    },
    [
      { start: "2026-09-06", end: "2026-09-13", quota: 35, sold: 20, adult: 1099, single: 320 },
      { start: "2026-10-11", end: "2026-10-18", quota: 35, sold: 9, adult: 999, single: 300 },
    ],
  );

  await createTour(
    {
      destSlug: "beneluks-turlari",
      slug: "beneluks-6-gece",
      titleTr: "Benelüks Turu: Brüksel · Amsterdam · Lüksemburg",
      summaryTr: "Üç ülke, masalsı kanallar, çikolata ve laleler arasında 6 gece.",
      descriptionTr: "Belçika, Hollanda ve Lüksemburg’u kapsayan klasik Benelüks turu. Brüksel’in Grand Place’i, Bruges’ün kanalları, Amsterdam tekne turu, Lahey ve Lüksemburg’un zarif sokakları.",
      days: 7, nights: 6, transport: "MIXED", hotel: "FOUR_STAR", visa: true, basePriceEur: 1099,
      featured: true, rating: 4.7,
      included: ["Gidiş-dönüş uçak", "6 gece 4* otel + kahvaltı", "Lüks otobüs ile turlar", "Rehberlik"],
      excluded: ["Schengen vizesi", "Amsterdam tekne turu (opsiyonel)", "Öğle/akşam yemekleri"],
      itinerary: [
        { title: "İstanbul – Brüksel", desc: "Uçuş, otele yerleşme.", city: "Brüksel" },
        { title: "Brüksel & Bruges", desc: "Grand Place, Manneken Pis; Bruges kanal turu.", city: "Brüksel" },
        { title: "Brüksel – Amsterdam", desc: "Lahey ve Madurodam, Amsterdam’a geçiş.", city: "Amsterdam" },
        { title: "Amsterdam", desc: "Kanal tekne turu (opsiyonel), Dam Meydanı.", city: "Amsterdam" },
        { title: "Amsterdam – Lüksemburg", desc: "Köln molası, Lüksemburg’a geçiş.", city: "Lüksemburg" },
        { title: "Lüksemburg", desc: "Şehir turu, serbest zaman.", city: "Lüksemburg" },
        { title: "Lüksemburg – İstanbul", desc: "Dönüş uçuşu." },
      ],
      faqs: [
        { q: "Kaç ülke geziliyor?", a: "Belçika, Hollanda ve Lüksemburg olmak üzere 3 ülke; ayrıca Almanya Köln’de mola." },
        { q: "Yürüyüş çok mu?", a: "Şehir turları yürüyüş içerir; rahat ayakkabı öneririz." },
      ],
    },
    [
      { start: "2026-09-19", end: "2026-09-25", quota: 30, sold: 14, adult: 1149, single: 350 },
      { start: "2026-10-17", end: "2026-10-23", quota: 30, sold: 6, adult: 1099, single: 340 },
    ],
  );

  await createTour(
    {
      destSlug: "yunanistan-turlari",
      slug: "atina-4-gece",
      titleTr: "Atina 4 Gece",
      summaryTr: "Akropolis, Plaka ve antik tapınaklar; mavi-beyaz bir başkent molası.",
      descriptionTr: "Batı medeniyetinin beşiği Atina’da 4 gece. Akropolis ve Parthenon, antik Agora, Plaka’nın renkli sokakları ve Ege mutfağının lezzetleri.",
      days: 5, nights: 4, transport: "FLIGHT", hotel: "FOUR_STAR", visa: true, basePriceEur: 599,
      featured: true, campaign: true, rating: 4.7,
      included: ["Gidiş-dönüş uçak", "4 gece 4* otel + kahvaltı", "Rehberli şehir turu", "Transferler"],
      excluded: ["Schengen vizesi", "Müze giriş ücretleri", "Öğle/akşam yemekleri"],
      itinerary: [
        { title: "İstanbul – Atina", desc: "Uçuş, otele yerleşme.", city: "Atina" },
        { title: "Akropolis & Parthenon", desc: "Akropolis, Dionysos Tiyatrosu, Akropolis Müzesi.", city: "Atina" },
        { title: "Plaka & Antik Agora", desc: "Plaka, Agora, Syntagma Meydanı; serbest zaman.", city: "Atina" },
        { title: "Sunion (Opsiyonel)", desc: "Poseidon Tapınağı ve gün batımı turu.", city: "Atina" },
        { title: "Atina – İstanbul", desc: "Dönüş uçuşu." },
      ],
      faqs: [
        { q: "Adalara geçiş var mı?", a: "Bu program Atina odaklıdır; ada turları için Yunan Adaları paketlerimize bakabilirsiniz." },
        { q: "En iyi gezi mevsimi?", a: "İlkbahar ve sonbahar ideal; yaz aylarında hava sıcak olur." },
      ],
    },
    [
      { start: "2026-07-18", end: "2026-07-22", quota: 35, sold: 22, adult: 649, single: 170, early: 599, earlyUntil: "2026-06-25" },
      { start: "2026-09-12", end: "2026-09-16", quota: 35, sold: 7, adult: 599, single: 160 },
    ],
  );

  // ── testimonials ──────────────────────────────────────────────
  const testimonials = [
    { customerName: "Elif Y.", rating: 5, bodyTr: "Sharm El Sheikh turu mükemmeldi, otel ve rehber harikaydı. Kesinlikle tekrar tercih ederiz." },
    { customerName: "Murat K.", rating: 5, bodyTr: "Klasik İtalya turunda her şey dakikası dakikasına planlanmıştı. Profesyonel ekip." },
    { customerName: "Selin A.", rating: 4, bodyTr: "Moskova turu çok keyifliydi, rehberimiz çok bilgiliydi. Teşekkürler." },
    { customerName: "Ahmet D.", rating: 5, bodyTr: "Benelüks turu beklentimin üzerindeydi. Üç ülkeyi tek turda görmek harika." },
    { customerName: "Zeynep T.", rating: 5, bodyTr: "Rezervasyon süreci çok kolaydı, fiyatlar şeffaftı. Atina’ya bayıldık." },
    { customerName: "Caner B.", rating: 4, bodyTr: "Kahire-Nil gemi turu unutulmazdı. Organizasyon çok başarılıydı." },
  ];
  for (let i = 0; i < testimonials.length; i++)
    await db.testimonial.create({ data: { ...testimonials[i], sortOrder: i, isPublished: true } });

  // ── legal pages ───────────────────────────────────────────────
  const pages = [
    { slug: "hakkimizda", titleTr: "Hakkımızda", bodyTr: "<p><strong>ÖRNEK / DEMO METİN.</strong> Bu sayfa geliştirme/demo amaçlıdır; aşağıda anlatılan firma, belgeler ve faaliyetler <strong>kurgusaldır ve bağlayıcı değildir.</strong></p><p>Tur Acente, yurt dışı paket turlarında uzmanlaşmış örnek bir seyahat acentesidir. Mısır, Rusya, İtalya, Benelüks ve Yunanistan başta olmak üzere örnek tur içerikleri sunar.</p><p>Gerçek yayında bu metin; <strong>gerçek ticaret unvanı, vergi/MERSİS no, TÜRSAB belge no, adres ve iletişim bilgileri</strong> ile değiştirilmelidir. Bu içerik hukuki tavsiye değildir.</p>" },
    { slug: "kosullar", titleTr: "Kullanım Koşulları", bodyTr: "<p><strong>ÖRNEK / DEMO METİN — HUKUKİ BAĞLAYICILIĞI YOKTUR.</strong> Aşağıdaki koşullar yalnızca örnektir; gerçek kullanımdan önce bir <strong>avukat</strong> tarafından hazırlanmalı ve onaylanmalıdır.</p><p>Bu platform üzerinden sunulan içerikler örnek/demo niteliğindedir ve <strong>gerçek satış, rezervasyon veya tahsilat oluşturmaz.</strong></p><p>Gerçek bir tur satışı için 6502 sayılı Tüketici Kanunu ile Mesafeli Sözleşmeler ve Paket Tur Sözleşmeleri Yönetmelikleri uyarınca geçerli bir <strong>ön bilgilendirme formu</strong> ve <strong>paket tur sözleşmesi</strong> düzenlenmesi; ayrıca TÜRSAB üyeliği ve A grubu işletme belgesi (1618 sayılı Kanun) zorunludur.</p><p>Siteyi yayına alan/işleten taraf, yürürlükteki tüm yasal yükümlülüklerden <strong>tek başına sorumludur.</strong></p>" },
    { slug: "gizlilik", titleTr: "Gizlilik ve KVKK Aydınlatma Metni", bodyTr: "<p><strong>ÖRNEK / DEMO METİN — HUKUKİ BAĞLAYICILIĞI YOKTUR.</strong> Bu metin yalnızca bir KVKK aydınlatma metni örneğidir; <strong>gerçek bir aydınlatma metni ve açık rıza sürecinin yerine geçmez.</strong></p><p>Gerçek yayında 6698 sayılı KVKK kapsamında; gerçek <strong>aydınlatma metni</strong>, <strong>açık rıza</strong> beyanı, <strong>VERBİS</strong> kaydı ile veri saklama/imha politikası hazırlanmalıdır. Pasaport gibi özel nitelikli kişisel veriler için ek güvenlik tedbirleri gerekir.</p><p>Veri sorumlusunun gerçek kimliği ve iletişim bilgileri bu metinde yer almalıdır (buradaki bilgiler örnektir). Bu içerik hukuki tavsiye değildir.</p>" },
    { slug: "iptal-iade", titleTr: "İptal ve İade Koşulları", bodyTr: "<p><strong>ÖRNEK / DEMO METİN — HUKUKİ BAĞLAYICILIĞI YOKTUR.</strong> Aşağıdaki oranlar yalnızca örnektir ve <strong>bağlayıcı değildir.</strong></p><p>Örnek iptal koşulları (kalkışa kalan süreye göre): 30 günden önce %10, 15–30 gün arası %50, 15 günden az %100.</p><p>Gerçek iptal/iade ve <strong>cayma hakkı</strong> koşulları, Paket Tur Sözleşmeleri Yönetmeliği ve 6502 sayılı Kanun'a uygun olarak <strong>avukat onayıyla</strong> belirlenmelidir. Bu içerik hukuki tavsiye değildir.</p>" },
  ];
  for (const p of pages)
    await db.page.create({
      data: {
        ...p,
        status: "PUBLISHED",
        isSystem: true,
        publishedAt: new Date(),
        blocks: [
          { id: `${p.slug}-h`, type: "heading", props: { text: p.titleTr } },
          { id: `${p.slug}-t`, type: "richText", props: { body: p.bodyTr } },
        ],
      },
    });

  // sample block-based CMS landing page (built with the page builder)
  await db.page.create({
    data: {
      slug: "kampanyalar", titleTr: "Erken Rezervasyon Kampanyası", status: "PUBLISHED", isSystem: false, publishedAt: new Date(),
      seoTitle: "Erken Rezervasyon Kampanyaları 2026 | Tur Acente", seoDescription: "Erken rezervasyon avantajlı yurt dışı turları. Sınırlı kontenjan, en iyi fiyat.",
      blocks: [
        { id: "b1", type: "hero", props: { heading: "Erken Rezervasyona Özel Fiyatlar", subheading: "Yaz turlarında sınırlı süreyle indirim. Yeriniz dolmadan rezervasyon yapın.", ctaText: "Kampanyalı Turlar", ctaHref: "/turlar?kampanya=1", theme: "sunset" } },
        { id: "b2", type: "tourGrid", props: { title: "Kampanyalı Turlar", source: "campaign", limit: 3 } },
        { id: "b3", type: "features", props: { title: "Erken Rezervasyon Avantajları", itemsText: "En İyi Fiyat | Erken rezervasyonda en düşük fiyat garantisi\nUçak Yeri | Sınırlı kontenjanda yerinizi garantileyin\nEsnek Ödeme | Kapora ile rezervasyon, kalanı sonra\nÜcretsiz Danışmanlık | Uzman ekibimiz yanınızda" } },
        { id: "b4", type: "cta", props: { heading: "Hayalindeki tatil için acele et", text: "Kampanya kontenjanları hızla doluyor.", ctaText: "Tüm Turları Gör", ctaHref: "/turlar" } },
      ],
    },
  });

  // ── header menu ───────────────────────────────────────────────
  const menu = await db.menu.create({ data: { name: "Ana Menü", location: "HEADER" } });
  const menuItems = [
    { label: "Ana Sayfa", type: "CUSTOM_URL", url: "/", sortOrder: 0 },
    { label: "Turlar", type: "CUSTOM_URL", url: "/turlar", sortOrder: 1 },
    { label: "Kampanyalar", type: "CUSTOM_URL", url: "/turlar?kampanya=1", sortOrder: 2 },
    { label: "Hakkımızda", type: "PAGE", url: "/hakkimizda", sortOrder: 3 },
    { label: "İletişim", type: "CUSTOM_URL", url: "/iletisim", sortOrder: 4 },
  ];
  for (const mi of menuItems) await db.menuItem.create({ data: { menuId: menu.id, ...(mi as any) } });

  // ── footer menu (Kurumsal column) ─────────────────────────────
  const footerMenu = await db.menu.create({ data: { name: "Alt Menü", location: "FOOTER" } });
  const footerItems = [
    { label: "Hakkımızda", type: "CUSTOM_URL", url: "/hakkimizda", sortOrder: 0 },
    { label: "İletişim", type: "CUSTOM_URL", url: "/iletisim", sortOrder: 1 },
    { label: "Rezervasyon Sorgula", type: "CUSTOM_URL", url: "/rezervasyon-sorgula", sortOrder: 2 },
  ];
  for (const mi of footerItems) await db.menuItem.create({ data: { menuId: footerMenu.id, ...(mi as any) } });

  // ── roles + admin user ────────────────────────────────────────
  const roleDefs = [
    { key: "SUPER_ADMIN", name: "Süper Yönetici", realm: "STAFF" },
    { key: "SALES_AGENT", name: "Satış Temsilcisi", realm: "STAFF" },
    { key: "OPERATIONS", name: "Operasyon", realm: "STAFF" },
    { key: "ACCOUNTING", name: "Muhasebe", realm: "STAFF" },
    { key: "CONTENT_EDITOR", name: "İçerik Editörü", realm: "STAFF" },
    { key: "AGENCY_USER", name: "Acente Kullanıcısı", realm: "B2B" },
    { key: "CUSTOMER", name: "Müşteri", realm: "CUSTOMER" },
  ];
  const roles: Record<string, string> = {};
  for (const r of roleDefs) {
    const created = await db.role.create({ data: { ...(r as any), isSystem: true } });
    roles[r.key] = created.id;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@turacente.com";
  const adminPass = process.env.ADMIN_PASSWORD || "admin1234";
  const admin = await db.user.create({
    data: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPass, 10),
      realm: "STAFF",
      firstName: "Site",
      lastName: "Yönetici",
      emailVerifiedAt: new Date(),
      userRoles: { create: { roleId: roles.SUPER_ADMIN } },
    },
  });

  // ── B2B agency ────────────────────────────────────────────────
  const agency = await db.agency.create({
    data: {
      name: "Gezgin Tur",
      slug: "gezgin-tur",
      contactName: "Deniz Acar",
      email: "info@gezgintur.com",
      phone: "+90 212 000 00 00",
      status: "ACTIVE",
      pricingTier: "GOLD",
      commissionPercent: 8,
      creditLimitMinor: TRY(50000 / 35), // ~₺50.000
      balanceMinor: 0,
      currency: "TRY",
    },
  });
  const agencyUser = await db.user.create({
    data: {
      email: "deniz@gezgintur.com",
      passwordHash: await bcrypt.hash("acente1234", 10),
      realm: "B2B",
      firstName: "Deniz",
      lastName: "Acar",
      emailVerifiedAt: new Date(),
      userRoles: { create: { roleId: roles.AGENCY_USER } },
      agencyMemberships: { create: { agencyId: agency.id, isOwner: true } },
    },
  });

  // ── CRM pipeline ──────────────────────────────────────────────
  const pipeline = await db.crmPipeline.create({ data: { name: "Satış Hattı", isDefault: true } });
  const stageDefs = [
    { name: "Yeni", probability: 10, sortOrder: 0 },
    { name: "İletişim Kuruldu", probability: 25, sortOrder: 1 },
    { name: "Teklif Gönderildi", probability: 50, sortOrder: 2 },
    { name: "Pazarlık", probability: 70, sortOrder: 3 },
    { name: "Kazanıldı", probability: 100, sortOrder: 4, isWon: true },
    { name: "Kaybedildi", probability: 0, sortOrder: 5, isLost: true },
  ];
  const stages: Record<string, string> = {};
  for (const s of stageDefs) {
    const created = await db.crmStage.create({ data: { pipelineId: pipeline.id, ...s } });
    stages[s.name] = created.id;
  }

  // ── sample customers, reservations, payments, CRM ─────────────
  const sharmDate = await db.tourDate.findFirst({ where: { tour: { slug: "misir-sharm-el-sheikh-5-gece" } }, orderBy: { startDate: "asc" } });
  const italyDate = await db.tourDate.findFirst({ where: { tour: { slug: "klasik-italya-7-gece" } }, orderBy: { startDate: "asc" } });
  const moscowDate = await db.tourDate.findFirst({ where: { tour: { slug: "moskova-3-gece" } }, orderBy: { startDate: "asc" } });

  const c1 = await db.customer.create({ data: { firstName: "Ayşe", lastName: "Demir", email: "ayse@example.com", phone: "+90 532 111 11 11", lifecycleStage: "CUSTOMER", ownerId: admin.id, source: "DIRECT_WEB" } });
  const c2 = await db.customer.create({ data: { firstName: "Mehmet", lastName: "Yılmaz", email: "mehmet@example.com", phone: "+90 533 222 22 22", lifecycleStage: "CUSTOMER", source: "PHONE" } });
  const c3 = await db.customer.create({ data: { firstName: "Fatma", lastName: "Kaya", email: "fatma@example.com", phone: "+90 534 333 33 33", lifecycleStage: "OPPORTUNITY", ownerId: admin.id, source: "WHATSAPP" } });

  if (sharmDate) {
    const r1 = await db.reservation.create({
      data: {
        reference: "TA-7H2K9M", customerId: c1.id, tourId: sharmDate.tourId, tourDateId: sharmDate.id,
        channel: "DIRECT_WEB", status: "CONFIRMED", adults: 2, children: 1, infants: 0,
        currency: "TRY", exchangeRate: 35, exchangeRateAt: new Date(),
        subtotalMinor: TRY(1647), extrasMinor: TRY(75), discountMinor: 0, totalMinor: TRY(1722), paidMinor: TRY(1722), balanceMinor: 0,
        paymentMethod: "CREDIT_CARD", assignedToId: admin.id,
        passengers: { create: [
          { paxType: "ADULT", isLead: true, firstName: "Ayşe", lastName: "Demir", email: "ayse@example.com", phone: "+90 532 111 11 11", roomTypeId: rooms.DBL },
          { paxType: "ADULT", firstName: "Kemal", lastName: "Demir", roomTypeId: rooms.DBL },
          { paxType: "CHILD_WITH_BED", firstName: "Can", lastName: "Demir", roomTypeId: rooms.DBL },
        ] },
        payments: { create: { method: "CREDIT_CARD", status: "SUCCEEDED", amountMinor: TRY(1722), currency: "TRY", provider: "iyzico", paidAt: new Date() } },
      },
    });
    void r1;
  }
  if (italyDate) {
    await db.reservation.create({
      data: {
        reference: "TA-3P8Q1R", customerId: c2.id, tourId: italyDate.tourId, tourDateId: italyDate.id,
        channel: "DIRECT_WEB", status: "WAITING_PAYMENT", adults: 2, children: 0, infants: 0,
        currency: "TRY", exchangeRate: 35, exchangeRateAt: new Date(),
        subtotalMinor: TRY(2198), extrasMinor: 0, discountMinor: 0, totalMinor: TRY(2198), paidMinor: 0, balanceMinor: TRY(2198),
        paymentMethod: "BANK_TRANSFER", assignedToId: admin.id,
        passengers: { create: [
          { paxType: "ADULT", isLead: true, firstName: "Mehmet", lastName: "Yılmaz", email: "mehmet@example.com", phone: "+90 533 222 22 22", roomTypeId: rooms.DBL },
          { paxType: "ADULT", firstName: "Ela", lastName: "Yılmaz", roomTypeId: rooms.DBL },
        ] },
      },
    });
  }
  if (moscowDate) {
    await db.reservation.create({
      data: {
        reference: "TA-9X4L2D", customerId: c3.id, tourId: moscowDate.tourId, tourDateId: moscowDate.id,
        agencyId: agency.id, channel: "B2B", status: "PAYMENT_RECEIVED", adults: 1, children: 0, infants: 0,
        currency: "TRY", exchangeRate: 35, exchangeRateAt: new Date(),
        subtotalMinor: TRY(549), extrasMinor: 0, discountMinor: 0, totalMinor: TRY(549), paidMinor: TRY(549), balanceMinor: 0,
        paymentMethod: "AGENCY_CREDIT",
        passengers: { create: [{ paxType: "ADULT", isLead: true, firstName: "Fatma", lastName: "Kaya", roomTypeId: rooms.SGL }] },
        payments: { create: { method: "AGENCY_CREDIT", status: "SUCCEEDED", amountMinor: TRY(549), currency: "TRY", provider: "manual", paidAt: new Date() } },
        commissions: { create: { agencyId: agency.id, basisMinor: TRY(549), percent: 8, amountMinor: Math.round(TRY(549) * 0.08), currency: "TRY", status: "ACCRUED" } },
      },
    });
  }

  // CRM opportunities + activities
  if (sharmDate) {
    const opp = await db.crmOpportunity.create({
      data: {
        title: "Fatma Kaya — Mısır ilgisi", customerId: c3.id, ownerId: admin.id, pipelineId: pipeline.id, stageId: stages["Teklif Gönderildi"],
        destinationId: dest["misir-turlari"], status: "OPEN", estValueMinor: E(1200), currency: "EUR", adults: 2, source: "WHATSAPP",
      },
    });
    await db.crmActivity.create({ data: { type: "CALL", status: "DONE", subject: "İlk görüşme yapıldı", customerId: c3.id, opportunityId: opp.id, assignedToId: admin.id, createdById: admin.id, completedAt: new Date() } });
    await db.crmActivity.create({ data: { type: "TASK", status: "PENDING", subject: "Teklif takibi yap", customerId: c3.id, opportunityId: opp.id, assignedToId: admin.id, createdById: admin.id, dueAt: new Date(Date.now() + 86400000) } });
  }

  console.log("✅ Seed complete:");
  console.log(`   5 destinations, 6 tours, ${await db.tourDate.count()} departures, ${await db.tourPrice.count()} price rows`);
  console.log(`   ${await db.reservation.count()} reservations, ${await db.customer.count()} customers`);
  console.log(`   Admin: ${adminEmail} / ${adminPass}`);
  console.log(`   B2B:   deniz@gezgintur.com / acente1234`);
  void agencyUser;
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
