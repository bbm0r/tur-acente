import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane, Target, MessageSquare, Heart, StickyNote } from "lucide-react";
import { getCustomerProfile, listStaff } from "@/lib/crm";
import { formatMoney } from "@/lib/money";
import { formatDateRangeTr, formatDateTimeTr, formatDateTr } from "@/lib/utils";
import { reservationStatusLabel, reservationStatusColor } from "@/lib/labels";
import { CustomerEditor } from "@/components/admin/crm/CustomerEditor";
import { ActivityLogger } from "@/components/admin/crm/ActivityLogger";

export const metadata = { title: "Müşteri Profili" };

const ACT_LABEL: Record<string, string> = { CALL: "Arama", EMAIL: "E-posta", WHATSAPP: "WhatsApp", MEETING: "Görüşme", NOTE: "Not", TASK: "Görev", SMS: "SMS" };
const OPP_LABEL: Record<string, string> = { OPEN: "Açık", WON: "Kazanıldı", LOST: "Kaybedildi" };
const OPP_CLS: Record<string, string> = { OPEN: "bg-sky-100 text-sky-800", WON: "bg-emerald-100 text-emerald-700", LOST: "bg-rose-100 text-rose-700" };

export default async function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [c, staff] = await Promise.all([getCustomerProfile(id), listStaff()]);
  if (!c) notFound();

  const totalPaid = c.reservations.reduce((a, r) => a + r.paidMinor, 0);
  const openOpps = c.opportunities.filter((o) => o.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <Link href="/admin/musteriler" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Müşteriler</Link>

      <CustomerEditor
        customer={{ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, city: c.city, nationality: c.nationality, notes: c.notes, lifecycleStage: c.lifecycleStage, ownerId: c.ownerId, marketingConsent: c.marketingConsent, kvkkConsentAt: c.kvkkConsentAt?.toISOString() ?? null }}
        staff={staff}
        tags={c.tags.map((t) => ({ tagId: t.tagId, name: t.tag.name, color: t.tag.color }))}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Rezervasyon" value={String(c.reservations.length)} />
        <Stat label="Toplam Ödeme" value={formatMoney(totalPaid, "TRY")} />
        <Stat label="Açık Fırsat" value={String(openOpps)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Rezervasyonlar" icon={<Plane className="h-4 w-4" />}>
          {c.reservations.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{r.tour.titleTr}</div>
                <div className="text-xs text-ink-muted">{r.reference} · {formatDateRangeTr(r.tourDate.startDate, r.tourDate.endDate)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip ${reservationStatusColor[r.status] ?? "bg-slate-100 text-slate-600"}`}>{reservationStatusLabel[r.status] ?? r.status}</span>
                <span className="text-xs font-bold text-ink">{formatMoney(r.totalMinor, r.currency || "TRY")}</span>
              </div>
            </div>
          ))}
          {c.reservations.length === 0 && <Empty>Rezervasyon yok.</Empty>}
        </Section>

        <Section title="Fırsatlar" icon={<Target className="h-4 w-4" />}>
          {c.opportunities.map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{o.title}</div>
                <div className="text-xs text-ink-muted">{o.stage.name}{o.destination ? ` · ${o.destination.nameTr}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`chip ${OPP_CLS[o.status] ?? ""}`}>{OPP_LABEL[o.status] ?? o.status}</span>
                {o.estValueMinor != null && <span className="text-xs font-bold text-ink">{formatMoney(o.estValueMinor, o.currency || "EUR")}</span>}
              </div>
            </div>
          ))}
          {c.opportunities.length === 0 && <Empty>Fırsat yok.</Empty>}
        </Section>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><StickyNote className="h-4 w-4" /> Aktiviteler</h2>
        <ActivityLogger customerId={c.id} />
        <ol className="mt-3 space-y-3">
          {c.activities.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${a.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-700"}`}>{(ACT_LABEL[a.type] ?? a.type).slice(0, 3)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{a.subject} {a.status === "PENDING" && <span className="chip bg-amber-100 text-amber-800">Bekliyor</span>}</p>
                {a.body && <p className="text-xs text-ink-muted">{a.body}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">{ACT_LABEL[a.type] ?? a.type} · {formatDateTimeTr(a.createdAt)}{a.createdBy ? ` · ${a.createdBy.firstName} ${a.createdBy.lastName}` : ""}{a.dueAt ? ` · son: ${formatDateTr(a.dueAt)}` : ""}</p>
              </div>
            </li>
          ))}
          {c.activities.length === 0 && <li className="text-sm text-ink-muted">Henüz aktivite yok.</li>}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Favoriler" icon={<Heart className="h-4 w-4" />}>
          {c.favorites.map((fav) => (
            <Link key={fav.id} href={`/tur/${fav.tour.slug}`} target="_blank" className="block py-2 text-sm text-brand-700 hover:underline">{fav.tour.titleTr}</Link>
          ))}
          {c.favorites.length === 0 && <Empty>Favori yok.</Empty>}
        </Section>

        <Section title="Mesajlar" icon={<MessageSquare className="h-4 w-4" />}>
          {c.messages.map((m) => (
            <div key={m.id} className="py-2.5">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className={`chip ${m.direction === "IN" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{m.direction === "IN" ? "Gelen" : "Giden"}</span>
                {formatDateTimeTr(m.createdAt)}
              </div>
              {m.subject && <div className="mt-0.5 text-sm font-medium text-ink">{m.subject}</div>}
              <p className="text-sm text-ink-soft">{m.body}</p>
            </div>
          ))}
          {c.messages.length === 0 && <Empty>Mesaj yok.</Empty>}
        </Section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card p-4"><div className="text-xs text-ink-muted">{label}</div><div className="mt-0.5 text-xl font-extrabold text-ink">{value}</div></div>;
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="card p-5"><h2 className="mb-1 flex items-center gap-2 font-bold text-ink">{icon} {title}</h2><div className="divide-y divide-slate-100">{children}</div></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-sm text-ink-muted">{children}</p>;
}
