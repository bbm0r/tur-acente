import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTourBySlug } from "@/lib/catalog";
import { db } from "@/lib/db";
import { nightsBetween, formatDateRangeTr } from "@/lib/utils";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Rezervasyon", robots: { index: false } };

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const tour = await getTourBySlug(slug);
  if (!tour) notFound();

  const extras = await db.optionalExtra.findMany({
    where: { isActive: true, OR: [{ tourId: null }, { tourId: tour.id }] },
    orderBy: { priceMinor: "asc" },
  });

  const dates = tour.tourDates
    .map((td) => ({
      id: td.id,
      range: formatDateRangeTr(td.startDate, td.endDate),
      nights: nightsBetween(td.startDate, td.endDate),
      remaining: td.quota - td.seatsSold - td.seatsHeld,
      status: td.status,
    }))
    .filter((d) => d.remaining > 0 && d.status === "ACTIVE");

  const firstDate = tour.tourDates[0];
  const roomMap = new Map((firstDate?.prices ?? []).map((p) => [p.roomType.code, p.roomType.nameTr] as const));
  const rooms = [...roomMap.entries()].map(([code, nameTr]) => ({ code, nameTr }));

  if (dates.length === 0 || rooms.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Müsait tarih bulunamadı</h1>
        <p className="mt-2 text-ink-muted">Bu tur için şu an açık kontenjan yok.</p>
        <Link href={`/tur/${tour.slug}`} className="btn-primary mt-6">Tura geri dön</Link>
      </div>
    );
  }

  const initialDateId = sp.date && dates.some((d) => d.id === sp.date) ? sp.date : dates[0].id;

  return (
    <div className="bg-slate-50">
      <div className="container-page py-8">
        <BookingWizard
          tour={{
            id: tour.id,
            slug: tour.slug,
            titleTr: tour.titleTr,
            durationNights: tour.durationNights,
            destinationName: tour.destination.nameTr,
          }}
          dates={dates.map(({ id, range, nights, remaining }) => ({ id, range, nights, remaining }))}
          rooms={rooms}
          extras={extras.map((e) => ({ id: e.id, nameTr: e.nameTr, priceMinor: e.priceMinor, perPax: e.perPax }))}
          initialDateId={initialDateId}
        />
      </div>
    </div>
  );
}
