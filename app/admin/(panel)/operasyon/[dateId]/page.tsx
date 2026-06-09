import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, BedDouble, Wallet, Download } from "lucide-react";
import { getDepartureOps } from "@/lib/operations";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr } from "@/lib/utils";
import { paxTypeLabel, reservationStatusLabel, reservationStatusColor } from "@/lib/labels";

export default async function DepartureOps({ params }: { params: Promise<{ dateId: string }> }) {
  const { dateId } = await params;
  const ops = await getDepartureOps(dateId);
  if (!ops) notFound();
  const { td, reservations, pax, payment } = ops;

  // Rooming: group each reservation's passengers by room type
  const rooming = reservations.map((r) => {
    const groups = new Map<string, string[]>();
    for (const p of r.passengers) {
      const key = p.roomType?.nameTr ?? "—";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(`${p.firstName} ${p.lastName}`);
    }
    return { ref: r.reference, customer: `${r.customer.firstName} ${r.customer.lastName}`, groups: [...groups.entries()] };
  });

  return (
    <div>
      <Link href="/admin/operasyon" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Operasyon
      </Link>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">{td.tour.titleTr}</h1>
        <p className="text-sm text-ink-muted">{td.tour.destination.nameTr} · {formatDateRangeTr(td.startDate, td.endDate)} · {pax.length} yolcu · {reservations.length} rezervasyon</p>
      </header>

      {/* Pax list */}
      <Section title="Yolcu Listesi" icon={<Users className="h-5 w-5" />} dateId={dateId} type="pax">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="py-2">#</th><th className="py-2">Yolcu</th><th className="py-2">Tip</th><th className="py-2">Oda</th><th className="py-2">Referans</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pax.map((p, i) => (
              <tr key={i}>
                <td className="py-2 text-ink-muted">{i + 1}</td>
                <td className="py-2 font-medium text-ink">{p.name}{p.isLead && <span className="ml-2 chip bg-brand-50 text-brand-700">İletişim</span>}</td>
                <td className="py-2 text-ink-soft">{paxTypeLabel[p.paxType]}</td>
                <td className="py-2 text-ink-soft">{p.room}</td>
                <td className="py-2 font-mono text-xs text-brand-700">{p.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Rooming */}
      <Section title="Oda Listesi (Rooming)" icon={<BedDouble className="h-5 w-5" />} dateId={dateId} type="pax" hideExport>
        <div className="grid gap-3 sm:grid-cols-2">
          {rooming.map((r) => (
            <div key={r.ref} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-1 flex items-center justify-between text-xs"><span className="font-mono font-bold text-brand-700">{r.ref}</span><span className="text-ink-muted">{r.customer}</span></div>
              {r.groups.map(([room, names]) => (
                <div key={room} className="text-sm text-ink-soft"><span className="font-semibold text-ink">{room}:</span> {names.join(", ")}</div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Payment checklist */}
      <Section title="Ödeme Kontrol Listesi" icon={<Wallet className="h-5 w-5" />} dateId={dateId} type="payment">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="py-2">Referans</th><th className="py-2">Müşteri</th><th className="py-2 text-right">Toplam</th><th className="py-2 text-right">Bakiye</th><th className="py-2">Durum</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payment.map((p) => (
              <tr key={p.ref}>
                <td className="py-2 font-mono text-xs text-brand-700">{p.ref}</td>
                <td className="py-2 text-ink-soft">{p.customer}</td>
                <td className="py-2 text-right font-medium">{formatMoney(p.total)}</td>
                <td className="py-2 text-right">{p.balance > 0 ? <span className="font-semibold text-amber-600">{formatMoney(p.balance)}</span> : <span className="text-emerald-600">✓</span>}</td>
                <td className="py-2"><span className={`chip ${reservationStatusColor[p.status]}`}>{reservationStatusLabel[p.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, icon, dateId, type, hideExport, children }: { title: string; icon: React.ReactNode; dateId: string; type: string; hideExport?: boolean; children: React.ReactNode }) {
  return (
    <section className="card mb-5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-ink">{icon} {title}</h2>
        {!hideExport && (
          <a href={`/admin/operasyon/${dateId}/export?type=${type}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-slate-200">
            <Download className="h-3.5 w-3.5" /> CSV
          </a>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
