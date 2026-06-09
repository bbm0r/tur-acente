import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { TourForm } from "@/components/admin/tour/TourForm";
import { DateManager } from "@/components/admin/tour/DateManager";
import { PublishButton } from "@/components/admin/tour/PublishButton";

const tourStatusLabel: Record<string, string> = { DRAFT: "Taslak", PUBLISHED: "Yayında", HIDDEN: "Gizli", ARCHIVED: "Arşiv" };
const tourStatusColor: Record<string, string> = { DRAFT: "bg-slate-100 text-slate-600", PUBLISHED: "bg-emerald-100 text-emerald-700", HIDDEN: "bg-amber-100 text-amber-700", ARCHIVED: "bg-slate-100 text-slate-400" };

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tour, destinations] = await Promise.all([
    db.tour.findUnique({
      where: { id },
      include: {
        tourDates: {
          orderBy: { startDate: "asc" },
          include: { prices: { where: { roomType: { code: "DBL" }, paxType: "ADULT" } } },
        },
      },
    }),
    db.destination.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!tour) notFound();

  const initial = {
    titleTr: tour.titleTr, destinationId: tour.destinationId, summaryTr: tour.summaryTr, descriptionTr: tour.descriptionTr,
    durationDays: tour.durationDays, durationNights: tour.durationNights, transportType: tour.transportType, hotelCategory: tour.hotelCategory,
    visaRequired: tour.visaRequired, basePriceEur: Math.round(tour.basePriceMinor / 100), isFeatured: tour.isFeatured, isCampaign: tour.isCampaign,
    included: (tour.includedServices as unknown as string[]) ?? [], excluded: (tour.excludedServices as unknown as string[]) ?? [],
  };
  const dates = tour.tourDates.map((td) => ({
    id: td.id, start: td.startDate.toISOString(), end: td.endDate.toISOString(),
    quota: td.quota, seatsSold: td.seatsSold, status: td.status,
    adultEur: Math.round((td.prices[0]?.priceMinor ?? tour.basePriceMinor) / 100),
  }));

  return (
    <div className="max-w-3xl">
      <Link href="/admin/turlar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Turlar
      </Link>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{tour.titleTr}</h1>
            <span className={`chip ${tourStatusColor[tour.status]}`}>{tourStatusLabel[tour.status]}</span>
          </div>
          {tour.status === "PUBLISHED" && (
            <Link href={`/tur/${tour.slug}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
              /tur/{tour.slug} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <PublishButton tourId={tour.id} status={tour.status} />
      </header>

      <div className="space-y-6">
        <TourForm destinations={destinations.map((d) => ({ id: d.id, name: d.nameTr }))} mode="edit" tourId={tour.id} initial={initial} />
        <DateManager tourId={tour.id} dates={dates} />
      </div>
    </div>
  );
}
