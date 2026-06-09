import Link from "next/link";
import { MapPin, CalendarDays, ChevronRight, Plane } from "lucide-react";
import { getCustomerUser } from "@/lib/auth";
import { getMyReservations } from "@/lib/account";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor } from "@/lib/labels";

export default async function MyReservations() {
  const user = await getCustomerUser();
  const reservations = user?.customerId ? await getMyReservations(user.customerId) : [];

  if (reservations.length === 0) {
    return (
      <div className="card grid place-items-center gap-3 p-16 text-center">
        <Plane className="h-9 w-9 text-slate-300 -rotate-45" />
        <p className="font-semibold text-ink">Henüz rezervasyonunuz yok</p>
        <p className="text-sm text-ink-muted">Turları keşfedin ve ilk tatilinizi planlayın.</p>
        <Link href="/turlar" className="btn-primary mt-2">Turları Keşfet</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reservations.map((r) => (
        <Link key={r.id} href={`/hesabim/rezervasyon/${r.reference}`} className="card flex items-center gap-4 p-5 transition hover:shadow-cardHover">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-700">{r.reference}</span>
              <span className={`chip ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span>
            </div>
            <div className="mt-1 truncate font-semibold text-ink">{r.tour.titleTr}</div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {r.tour.destination.nameTr}</span>
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {formatDateRangeTr(r.tourDate.startDate, r.tourDate.endDate)}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-extrabold text-ink">{formatMoney(r.totalMinor)}</div>
            {r.balanceMinor > 0 ? <div className="text-xs font-semibold text-amber-600">{formatMoney(r.balanceMinor)} kalan</div> : <div className="text-xs text-emerald-600">Ödendi</div>}
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>
      ))}
    </div>
  );
}
