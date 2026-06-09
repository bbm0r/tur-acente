import Link from "next/link";
import {
  CalendarClock, Wallet, Clock3, CheckCircle2, AlertTriangle, TicketsPlane, Inbox, TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr, formatDateTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor } from "@/lib/labels";

export default async function AdminDashboard() {
  const now = new Date();
  const [statusCounts, rev, outstanding, upcoming, activeFuture, recent, leadCount] = await Promise.all([
    db.reservation.groupBy({ by: ["status"], _count: true }),
    db.payment.aggregate({ _sum: { amountMinor: true }, where: { status: "SUCCEEDED" } }),
    db.reservation.aggregate({ _sum: { balanceMinor: true }, where: { status: { in: ["NEW_REQUEST", "WAITING_PAYMENT", "PAYMENT_RECEIVED"] } } }),
    db.tourDate.findMany({ where: { startDate: { gte: now }, status: { in: ["ACTIVE", "FULL"] } }, include: { tour: true }, orderBy: { startDate: "asc" }, take: 6 }),
    db.tourDate.findMany({ where: { startDate: { gte: now }, status: "ACTIVE" }, include: { tour: true } }),
    db.reservation.findMany({ include: { customer: true, tour: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.lead.count({ where: { status: "NEW" } }),
  ]);

  const countOf = (...s: string[]) => statusCounts.filter((x) => s.includes(x.status)).reduce((a, b) => a + b._count, 0);
  const total = statusCounts.reduce((a, b) => a + b._count, 0);
  const lowQuota = activeFuture
    .map((td) => ({ ...td, remaining: td.quota - td.seatsSold - td.seatsHeld }))
    .filter((x) => x.remaining <= 5)
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 5);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Gösterge Paneli</h1>
        <p className="text-sm text-ink-muted">{formatDateTr(now)} · genel durum özeti</p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<TicketsPlane className="h-5 w-5" />} label="Toplam Rezervasyon" value={String(total)} tone="brand" />
        <Stat icon={<Clock3 className="h-5 w-5" />} label="Bekleyen" value={String(countOf("NEW_REQUEST", "WAITING_PAYMENT"))} tone="amber" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Onaylı" value={String(countOf("CONFIRMED", "PAYMENT_RECEIVED"))} tone="emerald" />
        <Stat icon={<Inbox className="h-5 w-5" />} label="Yeni Talep (Lead)" value={String(leadCount)} tone="slate" />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Toplam Tahsilat" value={formatMoney(rev._sum.amountMinor ?? 0)} tone="emerald" />
        <Stat icon={<Wallet className="h-5 w-5" />} label="Açık Bakiye" value={formatMoney(outstanding._sum.balanceMinor ?? 0)} tone="amber" />
        <Stat icon={<CalendarClock className="h-5 w-5" />} label="Yaklaşan Kalkış" value={String(upcoming.length)} tone="brand" />
        <Stat icon={<AlertTriangle className="h-5 w-5" />} label="Düşük Kontenjan" value={String(lowQuota.length)} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming departures */}
        <Panel title="Yaklaşan Kalkışlar" icon={<CalendarClock className="h-5 w-5" />}>
          <div className="space-y-3">
            {upcoming.map((td) => {
              const fill = Math.round((td.seatsSold / Math.max(1, td.quota)) * 100);
              return (
                <div key={td.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-ink">{td.tour.titleTr}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{formatDateTr(td.startDate)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${fill >= 90 ? "bg-rose-500" : fill >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${fill}%` }} />
                    </div>
                    <span className="text-xs font-medium text-ink-muted">{td.seatsSold}/{td.quota}</span>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && <Empty>Yaklaşan kalkış yok.</Empty>}
          </div>
        </Panel>

        {/* Low quota */}
        <Panel title="Düşük Kontenjan Uyarıları" icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}>
          <div className="space-y-2">
            {lowQuota.map((td) => (
              <div key={td.id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">{td.tour.titleTr}</div>
                  <div className="text-xs text-ink-muted">{formatDateRangeTr(td.startDate, td.endDate)}</div>
                </div>
                <span className="chip shrink-0 bg-rose-100 text-rose-700">Son {td.remaining} yer</span>
              </div>
            ))}
            {lowQuota.length === 0 && <Empty>Tüm kalkışlarda yeterli kontenjan var. 👍</Empty>}
          </div>
        </Panel>
      </div>

      {/* Recent reservations */}
      <Panel className="mt-6" title="Son Rezervasyonlar" icon={<TicketsPlane className="h-5 w-5" />} action={{ href: "/admin/rezervasyonlar", label: "Tümü" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="py-2">Referans</th><th className="py-2">Müşteri</th><th className="py-2">Tur</th><th className="py-2">Tutar</th><th className="py-2">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5 font-mono text-xs font-semibold text-brand-700">{r.reference}</td>
                  <td className="py-2.5">{r.customer.firstName} {r.customer.lastName}</td>
                  <td className="py-2.5 max-w-[220px] truncate text-ink-soft">{r.tour.titleTr}</td>
                  <td className="py-2.5 font-semibold">{formatMoney(r.totalMinor)}</td>
                  <td className="py-2.5"><span className={`chip ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

const tones: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-600",
};

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="truncate text-xl font-extrabold text-ink">{value}</div>
      </div>
    </div>
  );
}

function Panel({ title, icon, action, className, children }: { title: string; icon: React.ReactNode; action?: { href: string; label: string }; className?: string; children: React.ReactNode }) {
  return (
    <section className={`card p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-ink">{icon} {title}</h2>
        {action && <Link href={action.href} className="text-sm font-semibold text-brand-700 hover:underline">{action.label}</Link>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-ink-muted">{children}</div>;
}
