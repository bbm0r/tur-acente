"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Loader2, Phone, Mail, MessageCircle, Users, StickyNote, CheckSquare, Trophy, Ban, Plus } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatDateTimeTr, formatDateTr } from "@/lib/utils";
import { getOpportunityAction, logActivityAction, setOpportunityStatusAction } from "@/app/admin/(panel)/crm/actions";

const ACT_META: Record<string, { label: string; Icon: typeof Phone }> = {
  CALL: { label: "Arama", Icon: Phone }, EMAIL: { label: "E-posta", Icon: Mail }, WHATSAPP: { label: "WhatsApp", Icon: MessageCircle },
  MEETING: { label: "Görüşme", Icon: Users }, NOTE: { label: "Not", Icon: StickyNote }, TASK: { label: "Görev", Icon: CheckSquare }, SMS: { label: "SMS", Icon: MessageCircle },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Opp = any;

export function OpportunityDrawer({ oppId, onClose, onChanged }: { oppId: string; onClose: () => void; onChanged: () => void }) {
  const [opp, setOpp] = useState<Opp>(null);
  const [loading, setLoading] = useState(true);
  const [, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [actType, setActType] = useState("NOTE");
  const [actSubject, setActSubject] = useState("");
  const [actBody, setActBody] = useState("");
  const [actDue, setActDue] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOpportunityAction(oppId).then((r) => { if (!active) return; if (r.ok) setOpp(r.opp); else setErr(r.error); setLoading(false); });
    return () => { active = false; };
  }, [oppId]);

  function reload() { getOpportunityAction(oppId).then((r) => { if (r.ok) setOpp(r.opp); }); onChanged(); }

  function addActivity() {
    if (!actSubject.trim()) return;
    setBusy(true); setErr("");
    start(async () => {
      const r = await logActivityAction({ opportunityId: oppId, type: actType, subject: actSubject, body: actBody, dueAt: actDue || undefined });
      setBusy(false);
      if (r.ok) { setActSubject(""); setActBody(""); setActDue(""); reload(); } else setErr(r.error);
    });
  }
  function setStatus(status: string) {
    const lostReason = status === "LOST" ? (window.prompt("Kayıp nedeni (ops.)") || undefined) : undefined;
    setBusy(true); setErr("");
    start(async () => {
      const r = await setOpportunityStatusAction(oppId, status, lostReason);
      setBusy(false);
      if (r.ok) reload(); else setErr(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="truncate pr-4 text-base font-bold text-ink">{opp?.title ?? "Fırsat"}</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </header>
        {loading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand-500" /></div>
        ) : !opp ? (
          <div className="p-6 text-sm text-rose-600">{err || "Bulunamadı."}</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-slate-100 p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`chip ${opp.status === "WON" ? "bg-emerald-100 text-emerald-700" : opp.status === "LOST" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-800"}`}>{opp.status === "WON" ? "Kazanıldı" : opp.status === "LOST" ? "Kaybedildi" : "Açık"}</span>
                {opp.stageName && <span className="chip bg-slate-100 text-ink-muted">{opp.stageName}</span>}
                {opp.reservationId && <span className="chip bg-emerald-50 text-emerald-700">Rezervasyona bağlı</span>}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Field label="Müşteri" value={`${opp.customer.firstName} ${opp.customer.lastName}`} />
                <Field label="Temsilci" value={opp.owner ?? "—"} />
                <Field label="Tahmini Değer" value={opp.estValueMinor != null ? formatMoney(opp.estValueMinor, opp.currency || "EUR") : "—"} />
                <Field label="Seyahat Tarihi" value={opp.expectedTravelDate ? formatDateTr(opp.expectedTravelDate) : "—"} />
                {opp.destinationName ? <Field label="Destinasyon" value={opp.destinationName} /> : null}
                {(opp.adults || opp.children) ? <Field label="Kişi" value={`${opp.adults || 0} yetişkin${opp.children ? ` + ${opp.children} çocuk` : ""}`} /> : null}
              </dl>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{opp.customer.email}</span>
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{opp.customer.phone}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStatus("WON")} disabled={busy || opp.status === "WON"} className="btn-primary flex-1 py-2 text-xs"><Trophy className="h-4 w-4" /> Kazanıldı</button>
                <button onClick={() => setStatus("LOST")} disabled={busy || opp.status === "LOST"} className="btn-ghost flex-1 py-2 text-xs text-rose-600"><Ban className="h-4 w-4" /> Kaybedildi</button>
              </div>
              {opp.lostReason && <p className="mt-2 text-xs text-rose-600">Kayıp nedeni: {opp.lostReason}</p>}
            </div>

            <div className="border-b border-slate-100 p-5">
              <h3 className="mb-2 text-sm font-bold text-ink">Aktivite Ekle</h3>
              <div className="flex gap-2">
                <select value={actType} onChange={(e) => setActType(e.target.value)} className="input h-9 w-28 text-xs">
                  {Object.entries(ACT_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <input value={actSubject} onChange={(e) => setActSubject(e.target.value)} placeholder="Konu" className="input h-9 flex-1 text-sm" />
              </div>
              <textarea value={actBody} onChange={(e) => setActBody(e.target.value)} placeholder="Not (ops.)" className="input mt-2 min-h-[60px] text-sm" />
              <div className="mt-2 flex items-center gap-2">
                <input type="date" value={actDue} onChange={(e) => setActDue(e.target.value)} title="Son tarih → takip görevi" className="input h-9 w-40 text-xs" />
                <button onClick={addActivity} disabled={busy || !actSubject.trim()} className="btn-primary py-2 text-xs">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ekle</button>
              </div>
              {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}
            </div>

            <div className="p-5">
              <h3 className="mb-3 text-sm font-bold text-ink">Zaman Çizelgesi</h3>
              <ol className="space-y-3">
                {opp.activities.map((a: Opp) => {
                  const m = ACT_META[a.type] ?? ACT_META.NOTE;
                  const Icon = m.Icon;
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${a.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-brand-50 text-brand-700"}`}><Icon className="h-3.5 w-3.5" /></span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{a.subject} {a.status === "PENDING" && <span className="chip bg-amber-100 text-amber-800">Bekliyor</span>}</p>
                        {a.body && <p className="text-xs text-ink-muted">{a.body}</p>}
                        <p className="mt-0.5 text-[11px] text-slate-400">{m.label} · {formatDateTimeTr(a.createdAt)}{a.createdBy ? ` · ${a.createdBy}` : ""}{a.dueAt ? ` · son: ${formatDateTr(a.dueAt)}` : ""}</p>
                      </div>
                    </li>
                  );
                })}
                {opp.activities.length === 0 && <li className="text-sm text-ink-muted">Henüz aktivite yok.</li>}
              </ol>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt><dd className="font-medium text-ink">{value}</dd></div>;
}
