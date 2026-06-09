import Link from "next/link";
import { ListChecks, Users, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateRangeTr } from "@/lib/utils";

export default async function OperationsList() {
  const departures = await db.tourDate.findMany({
    where: { reservations: { some: { status: { notIn: ["CANCELLED", "REFUNDED"] } } } },
    include: {
      tour: { include: { destination: true } },
      reservations: { where: { status: { notIn: ["CANCELLED", "REFUNDED"] } }, select: { adults: true, children: true, infants: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Operasyon</h1>
        <p className="text-sm text-ink-muted">Kalkışa göre yolcu, oda, pasaport ve ödeme listeleri</p>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Tur</th>
                <th className="px-4 py-3">Kalkış</th>
                <th className="px-4 py-3">Rezervasyon</th>
                <th className="px-4 py-3">Yolcu</th>
                <th className="px-4 py-3">Tedarikçi</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departures.map((d) => {
                const pax = d.reservations.reduce((s, r) => s + r.adults + r.children + r.infants, 0);
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{d.tour.titleTr}</div>
                      <div className="text-xs text-ink-muted">{d.tour.destination.nameTr}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDateRangeTr(d.startDate, d.endDate)}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.reservations.length}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 font-semibold text-ink"><Users className="h-4 w-4 text-brand-600" /> {pax}</span></td>
                    <td className="px-4 py-3">
                      {d.supplierConfirmed
                        ? <span className="chip bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Onaylı</span>
                        : <span className="chip bg-amber-100 text-amber-800"><Clock className="h-3.5 w-3.5" /> Bekliyor</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/operasyon/${d.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                        Listeler <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {departures.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Rezervasyonu olan kalkış yok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
