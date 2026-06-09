import Link from "next/link";
import { Search } from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor } from "@/lib/labels";

export default async function AdminReservations({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status;
  const q = sp.q?.trim();

  const where: any = {};
  if (status) where.status = status;
  if (q)
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { customer: { is: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } } },
    ];

  const [reservations, statusCounts, total] = await Promise.all([
    db.reservation.findMany({ where, include: { customer: true, tour: true, tourDate: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.reservation.groupBy({ by: ["status"], _count: true }),
    db.reservation.count(),
  ]);
  const countOf = (s: string) => statusCounts.find((x) => x.status === s)?._count ?? 0;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Rezervasyonlar</h1>
          <p className="text-sm text-ink-muted">{reservations.length} kayıt gösteriliyor</p>
        </div>
        <form action="/admin/rezervasyonlar" method="get" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q ?? ""} placeholder="Referans veya müşteri ara…" className="input w-64 pl-9" />
          </div>
          <button className="btn-primary">Ara</button>
        </form>
      </header>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip href="/admin/rezervasyonlar" active={!status} label="Tümü" count={total} />
        {Object.keys(reservationStatusLabel).map((s) => (
          <FilterChip key={s} href={`/admin/rezervasyonlar?status=${s}`} active={status === s} label={reservationStatusLabel[s]} count={countOf(s)} />
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Referans</th>
                <th className="px-4 py-3">Müşteri</th>
                <th className="px-4 py-3">Tur</th>
                <th className="px-4 py-3">Kalkış</th>
                <th className="px-4 py-3">Kişi</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Bakiye</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/rezervasyonlar/${r.id}`} className="font-mono text-xs font-bold text-brand-700 hover:underline">{r.reference}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">{r.customer.firstName} {r.customer.lastName}</div>
                    <div className="text-xs text-ink-muted">{r.customer.email}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-ink-soft">{r.tour.titleTr}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDateTr(r.tourDate.startDate)}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.adults + r.children + r.infants}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatMoney(r.totalMinor)}</td>
                  <td className="px-4 py-3">
                    {r.balanceMinor > 0 ? <span className="font-semibold text-amber-600">{formatMoney(r.balanceMinor)}</span> : <span className="text-emerald-600">Ödendi</span>}
                  </td>
                  <td className="px-4 py-3"><span className={`chip ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span></td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-ink-muted">Kayıt bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link href={href} className={`chip ring-1 transition ${active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink-soft ring-slate-200 hover:bg-slate-100"}`}>
      {label} <span className={active ? "text-white/80" : "text-ink-muted"}>{count}</span>
    </Link>
  );
}
