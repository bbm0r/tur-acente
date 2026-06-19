import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, CalendarDays, Users, Mail, Phone, Banknote, FileText, User2, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr, formatDateTr, formatDateTimeTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor, paxTypeLabel } from "@/lib/labels";
import { nextStatuses } from "@/lib/statusMachine";
import { listReservationMessages } from "@/lib/messages";
import { StatusControl } from "@/components/admin/reservation/StatusControl";
import { PaymentForm } from "@/components/admin/reservation/PaymentForm";
import { NotesPanel } from "@/components/admin/reservation/NotesPanel";
import { AssignControl } from "@/components/admin/reservation/AssignControl";
import { MessagePanel } from "@/components/messaging/MessagePanel";
import { sendReplyAction } from "./actions";

const methodLabel: Record<string, string> = {
  CREDIT_CARD: "Kredi Kartı", BANK_TRANSFER: "Banka Havalesi", CASH: "Nakit", AGENCY_CREDIT: "Acente Bakiyesi", PARTIAL: "Kısmi",
};

export default async function ReservationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await db.reservation.findUnique({
    where: { id },
    include: {
      customer: true,
      tour: { include: { destination: true } },
      tourDate: true,
      passengers: { include: { roomType: true } },
      extras: { include: { optionalExtra: true } },
      payments: { include: { recordedBy: true }, orderBy: { createdAt: "desc" } },
      assignedTo: true,
      agency: true,
    },
  });
  if (!r) notFound();
  const staff = await db.user.findMany({ where: { realm: "STAFF", isActive: true }, orderBy: { firstName: "asc" } });
  const allowed = nextStatuses(r.status);
  const threadRaw = await listReservationMessages(r.id);
  const unreadInbound = threadRaw.filter((m) => m.direction === "IN" && !m.isRead).length;
  const thread = threadRaw.map((m) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    createdAtLabel: formatDateTimeTr(m.createdAt),
    senderName: m.senderName,
  }));

  return (
    <div>
      <Link href="/admin/rezervasyonlar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Rezervasyonlar
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-extrabold text-ink">{r.reference}</h1>
          <span className={`chip ${reservationStatusColor[r.status]}`}>{reservationStatusLabel[r.status]}</span>
          {r.agency && <span className="chip bg-violet-100 text-violet-700">B2B · {r.agency.name}</span>}
        </div>
        <span className="text-sm text-ink-muted">Oluşturma: {formatDateTr(r.createdAt)}</span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-1 font-bold text-ink">{r.tour.titleTr}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-600" /> {r.tour.destination.nameTr}</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-600" /> {formatDateRangeTr(r.tourDate.startDate, r.tourDate.endDate)}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-brand-600" /> {r.adults} yetişkin{r.children ? `, ${r.children} çocuk` : ""}{r.infants ? `, ${r.infants} bebek` : ""}</span>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-3 font-bold text-ink">Yolcular</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {r.passengers.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-medium text-ink">{p.firstName} {p.lastName}{p.isLead && <span className="ml-2 chip bg-brand-50 text-brand-700">İletişim</span>}</td>
                    <td className="py-2.5 text-ink-muted">{paxTypeLabel[p.paxType]}</td>
                    <td className="py-2.5 text-right text-ink-muted">{p.roomType?.nameTr ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {r.extras.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                <span className="font-semibold text-ink">Ekstralar: </span>
                <span className="text-ink-soft">{r.extras.map((e) => `${e.optionalExtra.nameTr} ×${e.quantity}`).join(", ")}</span>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><Banknote className="h-5 w-5 text-brand-600" /> Ödeme Geçmişi</h2>
            {r.payments.length === 0 ? (
              <p className="text-sm text-ink-muted">Henüz ödeme kaydı yok.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <tr><th className="py-1.5">Tarih</th><th className="py-1.5">Yöntem</th><th className="py-1.5">Kaydeden</th><th className="py-1.5 text-right">Tutar</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {r.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 text-ink-soft">{formatDateTr(p.paidAt ?? p.createdAt)}</td>
                      <td className="py-2 text-ink-soft">{methodLabel[p.method] ?? p.method}</td>
                      <td className="py-2 text-ink-muted">{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : p.provider}</td>
                      <td className="py-2 text-right font-semibold text-emerald-600">{formatMoney(p.amountMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><FileText className="h-5 w-5 text-brand-600" /> İç Notlar</h2>
            <NotesPanel reservationId={r.id} notes={r.notesInternal} />
          </section>

          <section className="card p-6">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <MessageCircle className="h-5 w-5 text-brand-600" /> Müşteri Mesajları
              {unreadInbound > 0 && <span className="chip bg-amber-100 text-amber-700">{unreadInbound} yeni</span>}
            </h2>
            <MessagePanel perspective="staff" messages={thread} action={sendReplyAction} boundArg={r.id} />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card p-5"><StatusControl reservationId={r.id} current={r.status} allowed={allowed} /></div>

          <div className="card p-5">
            <div className="mb-3 text-sm font-semibold text-ink">Ödeme Özeti</div>
            <div className="space-y-1.5 text-sm">
              <Row label="Toplam" value={formatMoney(r.totalMinor)} strong />
              <Row label="Ödenen" value={formatMoney(r.paidMinor)} />
              <Row label="Kalan" value={formatMoney(r.balanceMinor)} highlight={r.balanceMinor > 0} />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4"><PaymentForm reservationId={r.id} balanceMinor={r.balanceMinor} /></div>
          </div>

          <div className="card p-5"><AssignControl reservationId={r.id} current={r.assignedToId} staff={staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }))} /></div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><User2 className="h-4 w-4" /> Müşteri</div>
            <div className="space-y-1.5 text-sm text-ink-soft">
              <div className="font-medium text-ink">{r.customer.firstName} {r.customer.lastName}</div>
              <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-ink-muted" /> {r.customer.email}</div>
              <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-ink-muted" /> {r.customer.phone}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className={`${strong ? "text-lg font-extrabold" : "font-medium"} ${highlight ? "text-amber-600" : "text-ink"}`}>{value}</span>
    </div>
  );
}
