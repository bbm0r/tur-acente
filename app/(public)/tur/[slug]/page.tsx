import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight, Check, X, MapPin, Plane, BedDouble, FileText,
  CalendarDays, Users, ShieldCheck, MessageCircle, Clock, Info,
} from "lucide-react";
import { getTourBySlug, getSimilarTours } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/auth";
import { getFavoriteTourIds } from "@/lib/account";
import { destinationTheme } from "@/lib/theme";
import { formatMoney, eurToTryMinor, DEMO_EUR_TRY } from "@/lib/money";
import { transportLabel, hotelStars } from "@/lib/labels";
import { formatDateRangeTr, nightsBetween } from "@/lib/utils";
import { Stars } from "@/components/public/Stars";
import { TourCard } from "@/components/public/TourCard";
import { FavoriteButton } from "@/components/account/FavoriteButton";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTourBySlug(slug);
  if (!t) return { title: "Tur bulunamadı" };
  return { title: t.seoTitle ?? t.titleTr, description: t.seoDescription ?? t.summaryTr };
}

function dblAdultMinorEur(td: any): { minor: number; early: boolean } {
  const now = new Date();
  const early = !!(td.earlyBirdUntil && now <= new Date(td.earlyBirdUntil));
  const row = td.prices.find((p: any) => p.roomType.code === "DBL" && p.paxType === "ADULT");
  if (!row) return { minor: 0, early: false };
  const minor = early && row.earlyBirdPriceMinor ? row.earlyBirdPriceMinor : row.priceMinor;
  return { minor, early: early && !!row.earlyBirdPriceMinor };
}

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();
  const similar = await getSimilarTours(tour.id, tour.destinationId, 3);
  const theme = destinationTheme(tour.destination.slug);
  const me = await getCustomerUser();
  const favIds = me?.customerId ? await getFavoriteTourIds(me.customerId) : new Set<string>();

  const included = (tour.includedServices as unknown as string[]) ?? [];
  const excluded = (tour.excludedServices as unknown as string[]) ?? [];
  const dates = tour.tourDates.map((td) => {
    const { minor, early } = dblAdultMinorEur(td);
    return {
      id: td.id,
      range: formatDateRangeTr(td.startDate, td.endDate),
      nights: nightsBetween(td.startDate, td.endDate),
      remaining: td.quota - td.seatsSold - td.seatsHeld,
      status: td.status,
      tryMinor: eurToTryMinor(minor, DEMO_EUR_TRY),
      early,
    };
  });
  const fromMinor = dates.length ? Math.min(...dates.map((d) => d.tryMinor).filter((m) => m > 0)) : eurToTryMinor(tour.basePriceMinor, DEMO_EUR_TRY);
  const cheapest = dates.slice().sort((a, b) => a.tryMinor - b.tryMinor)[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.titleTr,
    description: tour.summaryTr,
    touristType: "Leisure",
    offers: { "@type": "Offer", price: (fromMinor / 100).toFixed(0), priceCurrency: "TRY", availability: "https://schema.org/InStock" },
    ...(tour.ratingAvg ? { aggregateRating: { "@type": "AggregateRating", ratingValue: tour.ratingAvg, reviewCount: tour.ratingCount } } : {}),
  };

  return (
    <div className="bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} text-white`}>
        <div className="absolute -right-8 top-0 text-[14rem] leading-none opacity-20">{theme.emoji}</div>
        <div className="container-page relative py-12">
          <nav className="flex flex-wrap items-center gap-1 text-sm text-white/80">
            <Link href="/" className="hover:underline">Ana Sayfa</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/turlar/${tour.destination.slug}`} className="hover:underline">{tour.destination.nameTr}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-white">{tour.titleTr}</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="chip bg-white/20 ring-1 ring-white/25"><MapPin className="h-3.5 w-3.5" /> {tour.destination.nameTr}</span>
            <span className="chip bg-white/20 ring-1 ring-white/25"><Clock className="h-3.5 w-3.5" /> {tour.durationDays} gün / {tour.durationNights} gece</span>
            {tour.isCampaign && <span className="chip bg-accent-500 text-ink">🔥 Kampanya</span>}
          </div>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold drop-shadow-sm sm:text-4xl">{tour.titleTr}</h1>
          <div className="mt-3"><Stars value={tour.ratingAvg} count={tour.ratingCount} /></div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-10">
          <p className="text-lg leading-relaxed text-ink-soft">{tour.descriptionTr}</p>

          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={<Plane className="h-5 w-5" />} label="Ulaşım" value={transportLabel[tour.transportType]} />
            <Fact icon={<BedDouble className="h-5 w-5" />} label="Konaklama" value={hotelStars[tour.hotelCategory] || "—"} />
            <Fact icon={<FileText className="h-5 w-5" />} label="Vize" value={tour.visaRequired ? "Gerekli" : "Schengen"} />
            <Fact icon={<CalendarDays className="h-5 w-5" />} label="Kalkış" value={`${dates.length} tarih`} />
          </div>

          {/* Itinerary */}
          {tour.itineraryDays.length > 0 && (
            <Block title="Gün Gün Program" id="program">
              <ol className="relative space-y-5 border-l-2 border-brand-100 pl-6">
                {tour.itineraryDays.map((d) => (
                  <li key={d.id} className="relative">
                    <span className="absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{d.dayNumber}</span>
                    <h3 className="font-bold text-ink">{d.titleTr}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{d.descriptionTr}</p>
                    {d.overnightCity && <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand-700"><MapPin className="h-3 w-3" /> Konaklama: {d.overnightCity}</span>}
                  </li>
                ))}
              </ol>
            </Block>
          )}

          {/* Included / excluded */}
          <Block title="Fiyata Dahil Olan / Olmayan Hizmetler">
            <div className="grid gap-6 sm:grid-cols-2">
              <ServiceList items={included} ok title="Dahil Hizmetler" />
              <ServiceList items={excluded} title="Hariç Hizmetler" />
            </div>
          </Block>

          {/* Departures table */}
          <Block title="Müsait Kalkış Tarihleri ve Fiyatlar" id="tarihler">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Kişi Başı (2'li oda)</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dates.map((d) => {
                    const soldOut = d.remaining <= 0 || d.status === "FULL";
                    return (
                      <tr key={d.id} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{d.range}</div>
                          <div className="text-xs text-ink-muted">{d.nights} gece{d.early && <span className="ml-2 chip bg-accent-100 text-accent-700">Erken rezervasyon</span>}</div>
                        </td>
                        <td className="px-4 py-3">
                          {soldOut ? (
                            <span className="chip bg-rose-100 text-rose-700">Doldu</span>
                          ) : d.remaining <= 5 ? (
                            <span className="chip bg-amber-100 text-amber-800">Son {d.remaining} yer</span>
                          ) : (
                            <span className="chip bg-emerald-100 text-emerald-800">Müsait</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-base font-extrabold text-ink">{formatMoney(d.tryMinor)}</td>
                        <td className="px-4 py-3 text-right">
                          {soldOut ? (
                            <span className="text-xs text-ink-muted">—</span>
                          ) : (
                            <Link href={`/rezervasyon/${tour.slug}?date=${d.id}`} className="btn-primary px-4 py-2 text-sm">Rezervasyon</Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-ink-muted"><Info className="mt-0.5 h-4 w-4 shrink-0" /> Fiyatlar kişi başı, iki kişilik odada konaklama içindir. Tek kişi farkı, çocuk ve bebek fiyatları rezervasyon adımında hesaplanır.</p>
          </Block>

          {/* Conditions */}
          <Block title="Vize, İptal ve Rezervasyon Koşulları">
            <div className="space-y-4 text-sm">
              <Condition icon={<FileText className="h-4 w-4" />} title="Vize / Pasaport" body={tour.visaNotes ?? ""} />
              <Condition icon={<ShieldCheck className="h-4 w-4" />} title="İptal Koşulları" body={tour.cancellationPolicy ?? ""} />
              <Condition icon={<Info className="h-4 w-4" />} title="Rezervasyon Koşulları" body={tour.reservationTerms ?? ""} />
              <Condition icon={<MapPin className="h-4 w-4" />} title="Buluşma Noktası" body={tour.meetingPoint ?? ""} />
            </div>
          </Block>

          {/* FAQ */}
          {tour.faqs.length > 0 && (
            <Block title="Sıkça Sorulan Sorular">
              <div className="space-y-2">
                {tour.faqs.map((f) => (
                  <details key={f.id} className="group rounded-xl border border-slate-200 bg-white p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">
                      {f.questionTr}
                      <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                    </summary>
                    <p className="mt-2 text-sm text-ink-muted">{f.answerTr}</p>
                  </details>
                ))}
              </div>
            </Block>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-6">
            <div className="text-sm text-ink-muted">kişi başı</div>
            <div className="text-3xl font-extrabold text-ink">{formatMoney(fromMinor)}<span className="ml-1 text-sm font-medium text-ink-muted">’den</span></div>
            <p className="mt-1 text-xs text-ink-muted">2 kişilik odada, vergiler dahil</p>

            {cheapest && (
              <Link href={`/rezervasyon/${tour.slug}?date=${cheapest.id}`} className="btn-accent mt-5 w-full">
                <CalendarDays className="h-5 w-5" /> Hemen Rezervasyon Yap
              </Link>
            )}
            <a href="#tarihler" className="btn-ghost mt-2 w-full">Tüm tarihleri gör</a>
            <div className="mt-2"><FavoriteButton tourId={tour.id} initial={favIds.has(tour.id)} variant="full" /></div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm text-ink-soft">
              <Row icon={<Users className="h-4 w-4 text-brand-600" />}>Yetişkin, çocuk ve bebek fiyatlandırması</Row>
              <Row icon={<ShieldCheck className="h-4 w-4 text-brand-600" />}>Güvenli ödeme & şeffaf fiyat</Row>
              <Row icon={<Clock className="h-4 w-4 text-brand-600" />}>2 dakikada rezervasyon</Row>
            </div>

            <a
              href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP || "+905555555555").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Merhaba, ${tour.titleTr} turu hakkında bilgi almak istiyorum.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 font-semibold text-white"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp ile Sor
            </a>
          </div>
        </aside>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="container-page pb-12">
          <h2 className="mb-6 text-2xl font-extrabold text-ink">Benzer Turlar</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((t) => <TourCard key={t.id} tour={t as any} favorited={favIds.has(t.id)} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="text-sm font-bold text-ink">{value}</div>
      </div>
    </div>
  );
}

function ServiceList({ items, ok, title }: { items: string[]; ok?: boolean; title: string }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 font-bold text-ink">{title}</h3>
      <ul className="space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
            {ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />}
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Condition({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  if (!body) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-ink-soft">{icon}</span>
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <p className="text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{icon}{children}</div>;
}
