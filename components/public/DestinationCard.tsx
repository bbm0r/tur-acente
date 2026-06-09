import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { destinationTheme } from "@/lib/theme";

export function DestinationCard({
  destination,
}: {
  destination: { slug: string; nameTr: string; summaryTr: string | null; tourCount: number };
}) {
  const theme = destinationTheme(destination.slug);
  return (
    <Link
      href={`/turlar/${destination.slug}`}
      className={`group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-xl2 bg-gradient-to-br ${theme.gradient} p-5 text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover`}
    >
      <div className="absolute -right-3 -top-3 text-7xl opacity-30 transition group-hover:scale-110">{theme.emoji}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/15 to-black/5" />
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wide text-white/80">{destination.tourCount} tur</div>
        <h3 className="mt-1 text-xl font-extrabold drop-shadow-sm">{destination.nameTr}</h3>
      </div>
      <div className="relative flex items-center justify-between">
        <p className="max-w-[80%] text-sm text-white/90 line-clamp-2">{destination.summaryTr}</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 transition group-hover:bg-white group-hover:text-ink">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>
    </Link>
  );
}
