"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Loader2, ArrowRightCircle, CheckCircle2, Plane, FormInput } from "lucide-react";
import { formatDateTimeTr } from "@/lib/utils";
import { setLeadStatusAction, assignLeadAction, convertLeadAction } from "@/app/admin/(panel)/crm/actions";

type StaffLite = { id: string; firstName: string; lastName: string };
type LeadLite = {
  id: string; name: string; email: string; phone: string; message: string | null;
  status: string; createdAt: string;
  assignedTo: StaffLite | null; destinationName: string | null; tourTitle: string | null; formName: string | null;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Yeni", cls: "bg-amber-100 text-amber-800" },
  CONTACTED: { label: "Görüşüldü", cls: "bg-sky-100 text-sky-800" },
  CONVERTED: { label: "Dönüştürüldü", cls: "bg-emerald-100 text-emerald-700" },
  LOST: { label: "Kayıp", cls: "bg-slate-200 text-slate-600" },
};
const TABS: [string, string][] = [["ALL", "Tümü"], ["NEW", "Yeni"], ["CONTACTED", "Görüşüldü"], ["CONVERTED", "Dönüştürüldü"], ["LOST", "Kayıp"]];
const MANUAL_STATUSES: [string, string][] = [["NEW", "Yeni"], ["CONTACTED", "Görüşüldü"], ["LOST", "Kayıp"]];

export function LeadsInbox({ leads, staff }: { leads: LeadLite[]; staff: StaffLite[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [msg, setMsg] = useState("");

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) {
    setBusyId(id);
    setMsg("");
    start(async () => {
      const r = await fn();
      setBusyId(null);
      if (!r.ok) setMsg(r.error || "İşlem başarısız.");
      else { if (okMsg) setMsg(okMsg); router.refresh(); }
    });
  }

  const counts = leads.reduce<Record<string, number>>((a, l) => { a[l.status] = (a[l.status] ?? 0) + 1; return a; }, {});
  const shown = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`chip ${filter === key ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-muted hover:bg-slate-200"}`}>
            {label}{key === "ALL" ? ` · ${leads.length}` : counts[key] ? ` · ${counts[key]}` : ""}
          </button>
        ))}
      </div>
      {msg && <div className="mb-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</div>}
      <div className="card divide-y divide-slate-100">
        {shown.map((l) => {
          const st = STATUS[l.status] ?? STATUS.NEW;
          const busy = busyId === l.id;
          return (
            <div key={l.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{l.name}</span>
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  {l.formName && <span className="chip bg-indigo-100 text-indigo-700"><FormInput className="h-3 w-3" /> {l.formName}</span>}
                  {l.destinationName && <span className="chip bg-brand-50 text-brand-700"><MapPin className="h-3 w-3" /> {l.destinationName}</span>}
                  {l.tourTitle && <span className="chip bg-slate-100 text-ink-muted"><Plane className="h-3 w-3" /> {l.tourTitle}</span>}
                  {l.assignedTo && <span className="chip bg-violet-100 text-violet-700">{l.assignedTo.firstName} {l.assignedTo.lastName}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-muted">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {l.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {l.phone}</span>
                  <span>{formatDateTimeTr(l.createdAt)}</span>
                </div>
                {l.message && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{l.message}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {l.status === "CONVERTED" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Fırsata dönüştürüldü</span>
                ) : (
                  <>
                    <select value={l.status} disabled={busy} onChange={(e) => run(l.id, () => setLeadStatusAction(l.id, e.target.value))} className="input h-9 w-32 text-xs" title="Durum">
                      {MANUAL_STATUSES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={l.assignedTo?.id ?? ""} disabled={busy} onChange={(e) => run(l.id, () => assignLeadAction(l.id, e.target.value))} className="input h-9 w-40 text-xs" title="Temsilci ata">
                      <option value="">Atanmadı</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                    </select>
                    <button onClick={() => run(l.id, () => convertLeadAction(l.id), "Fırsat oluşturuldu ✓")} disabled={busy} className="btn-primary h-9 px-3 text-xs">
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5" />} Fırsata dönüştür
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="p-10 text-center text-sm text-ink-muted">Bu filtrede talep yok.</div>}
      </div>
    </div>
  );
}
