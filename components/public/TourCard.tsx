import Link from "next/link";
import { Clock, Plane, BedDouble, FileCheck2, ArrowRight } from "lucide-react";
import { destinationTheme } from "@/lib/theme";
import { formatMoney, eurToTryMinor, DEMO_EUR_TRY } from "@/lib/money";
import { transportLabel, hotelStars } from "@/lib/labels";
import { Stars } from "./Stars";
import { FavoriteButton } from "@/components/account/FavoriteButton";

type TourCardData = {
  id: string;
  slug: string;
  titleTr: string;
  summaryTr: string;
  durationDays: number;
  durationNights: number;
  transportType: string;
  hotelCategory: string;
  visaRequired: boolean;
  basePriceMinor: number;
  ratingAvg: number | null;
  ratingCount: number;
  isCampaign: boolean;
  destination: { slug: string; nameTr: string };
};

export function TourCard({ tour, favorited }: { tour: TourCardData; favorited?: boolean }) {
  const theme = destinationTheme(tour.destination.slug);
  const fromTry = eurToTryMinor(tour.basePriceMinor, DEMO_EUR_TRY);

  return (
    <Link
      href={`/tur/${tour.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl2 bg-white shadow-card ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-cardHover"
    >
      <div className={`relative h-44 bg-gradient-to-br ${theme.gradient}`}>
        <div className="absolute inset-0 grid place-items-center text-6xl opacity-90 drop-shadow">{theme.emoji}</div>
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="chip bg-white/90 text-ink">{tour.destination.nameTr}</span>
          {tour.isCampaign && <span className="chip bg-accent-500 text-ink">🔥 Kampanya</span>}
        </div>
        <div className="absolute right-3 top-3">
          <FavoriteButton tourId={tour.id} initial={favorited} />
        </div>
        <span className="absolute bottom-3 right-3 chip bg-black/40 text-white">
          <Clock className="h-3.5 w-3.5" /> {tour.durationNights} gece
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Stars value={tour.ratingAvg} count={tour.ratingCount} />
        <h3 className="mt-2 line-clamp-2 text-base font-bold text-ink group-hover:text-brand-700">
          {tour.titleTr}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{tour.summaryTr}</p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <Chip icon={<Plane className="h-3.5 w-3.5" />}>{transportLabel[tour.transportType]}</Chip>
          {hotelStars[tour.hotelCategory] && (
            <Chip icon={<BedDouble className="h-3.5 w-3.5" />}>{hotelStars[tour.hotelCategory]}</Chip>
          )}
          <Chip icon={<FileCheck2 className="h-3.5 w-3.5" />}>
            {tour.visaRequired ? "Vize gerekli" : "Vize: Schengen"}
          </Chip>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
          <div>
            <div className="text-xs text-ink-muted">kişi başı</div>
            <div className="text-xl font-extrabold text-ink">
              {formatMoney(fromTry)}
              <span className="ml-1 text-xs font-medium text-ink-muted">’den</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
            İncele <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-medium text-ink-soft">
      {icon}
      {children}
    </span>
  );
}
