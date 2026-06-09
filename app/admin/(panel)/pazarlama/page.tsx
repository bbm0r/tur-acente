import Link from "next/link";
import { Plus, Users, Mail, AlertCircle, Layers } from "lucide-react";
import { listSegments, listCampaigns, listTags } from "@/lib/crm";
import { lifecycleLabel } from "@/lib/labels";
import { SegmentForm } from "@/components/admin/crm/SegmentForm";
import { createCampaignAction } from "./actions";

export const metadata = { title: "Pazarlama" };

const CSTATUS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "Taslak", cls: "bg-slate-100 text-slate-600" },
  SENDING: { label: "Gönderiliyor", cls: "bg-amber-100 text-amber-800" },
  SENT: { label: "Gönderildi", cls: "bg-emerald-100 text-emerald-700" },
  SCHEDULED: { label: "Planlandı", cls: "bg-sky-100 text-sky-800" },
  CANCELLED: { label: "İptal", cls: "bg-rose-100 text-rose-700" },
};

export default async function Pazarlama({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const [segments, campaigns, tags] = await Promise.all([listSegments(), listCampaigns(), listTags()]);
  const tagName = (id?: string) => tags.find((t) => t.id === id)?.name;

  const summary = (f: { lifecycle?: string; tagId?: string; consentOnly?: boolean }) =>
    [f.lifecycle ? lifecycleLabel[f.lifecycle] ?? f.lifecycle : null, f.tagId ? `#${tagName(f.tagId) ?? "etiket"}` : null, f.consentOnly ? "izinli" : null]
      .filter(Boolean).join(" · ") || "Tüm kişiler";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Pazarlama</h1>
        <p className="text-sm text-ink-muted">Segmentler oluşturun, e-posta kampanyaları gönderin</p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><Layers className="h-4 w-4" /> Segmentler</h2>
        <div className="card mb-3 divide-y divide-slate-100">
          {segments.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <div className="font-medium text-ink">{s.name}</div>
                <div className="text-xs text-ink-muted">{summary(s.filter)}</div>
              </div>
              <span className="chip bg-brand-50 text-brand-700"><Users className="h-3 w-3" /> {s.memberCount} kişi</span>
            </div>
          ))}
          {segments.length === 0 && <div className="p-6 text-center text-sm text-ink-muted">Henüz segment yok.</div>}
        </div>
        <SegmentForm tags={tags.map((t) => ({ id: t.id, name: t.name }))} />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-bold text-ink"><Mail className="h-4 w-4" /> E-posta Kampanyaları</h2>
        <form action={createCampaignAction} className="card mb-3 flex flex-wrap items-end gap-3 p-4">
          <label className="block min-w-[220px] flex-1"><span className="label">Yeni kampanya adı</span><input name="name" required minLength={2} placeholder="Örn. Yaz Kampanyası" className="input" /></label>
          <button className="btn-primary"><Plus className="h-4 w-4" /> Oluştur</button>
          {e === "name" && <span className="flex items-center gap-1 text-sm text-rose-600"><AlertCircle className="h-4 w-4" /> Ad girin.</span>}
        </form>
        <div className="card divide-y divide-slate-100">
          {campaigns.map((c) => {
            const cs = CSTATUS[c.status] ?? CSTATUS.DRAFT;
            return (
              <Link key={c.id} href={`/admin/pazarlama/${c.id}`} className="flex items-center justify-between gap-3 p-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="font-medium text-ink">{c.name}</div>
                  <div className="text-xs text-ink-muted">{c.segment?.name ?? "segment seçilmedi"}{c.subject ? ` · ${c.subject}` : ""}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-muted">{c._count.recipients} alıcı</span>
                  <span className={`chip ${cs.cls}`}>{cs.label}</span>
                </div>
              </Link>
            );
          })}
          {campaigns.length === 0 && <div className="p-6 text-center text-sm text-ink-muted">Henüz kampanya yok.</div>}
        </div>
      </section>
    </div>
  );
}
