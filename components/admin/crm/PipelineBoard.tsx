"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, MapPin, X, Loader2, GripVertical } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { moveOpportunityAction, createOpportunityAction } from "@/app/admin/(panel)/crm/actions";
import { OpportunityDrawer } from "./OpportunityDrawer";

type Opp = { id: string; title: string; customerName: string; destinationName: string | null; ownerName: string | null; estValueMinor: number | null; currency: string; status: string };
type Stage = { id: string; name: string; probability: number; isWon: boolean; isLost: boolean; opportunities: Opp[] };
type CustomerLite = { id: string; firstName: string; lastName: string; email: string };
type DestLite = { slug: string; nameTr: string };

export function PipelineBoard({ stages, customers, destinations }: { stages: Stage[]; customers: CustomerLite[]; destinations: DestLite[] }) {
  const router = useRouter();
  const [board, setBoard] = useState<Stage[]>(stages);
  const dragId = useRef<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [openOppId, setOpenOppId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [, start] = useTransition();

  // Re-sync local (optimistic) board whenever the server data changes.
  useEffect(() => { setBoard(stages); }, [stages]);

  function onDrop(stageId: string) {
    const id = dragId.current;
    dragId.current = null;
    setOverStage(null);
    if (!id) return;
    const next = board.map((s) => ({ ...s, opportunities: s.opportunities.slice() }));
    let dragged: Opp | undefined;
    for (const s of next) {
      const i = s.opportunities.findIndex((o) => o.id === id);
      if (i !== -1) { if (s.id === stageId) return; dragged = s.opportunities.splice(i, 1)[0]; break; }
    }
    const target = next.find((s) => s.id === stageId);
    if (!dragged || !target) return;
    target.opportunities.unshift(dragged);
    setBoard(next); // optimistic
    start(async () => { await moveOpportunityAction(id, stageId); router.refresh(); });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-ink">Satış Hattı</h2>
        <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm"><Plus className="h-4 w-4" /> Yeni Fırsat</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {board.map((stage) => {
          const sum = stage.opportunities.reduce((a, o) => a + (o.estValueMinor ?? 0), 0);
          return (
            <div key={stage.id} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-ink">{stage.name}</span>
                <span className="chip bg-slate-100 text-ink-muted">{stage.opportunities.length} · %{stage.probability}</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
                onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                onDrop={() => onDrop(stage.id)}
                className={`min-h-[140px] space-y-2 rounded-xl p-2 transition ${overStage === stage.id ? "bg-brand-100 ring-2 ring-brand-300" : "bg-slate-100/70"}`}
              >
                {sum > 0 && <div className="px-1 text-[11px] font-semibold text-ink-muted">Σ {formatMoney(sum, stage.opportunities[0]?.currency || "EUR")}</div>}
                {stage.opportunities.map((o) => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => { dragId.current = o.id; }}
                    onClick={() => setOpenOppId(o.id)}
                    className={`card cursor-pointer p-3 transition hover:ring-1 hover:ring-brand-300 ${o.status === "WON" ? "border-l-4 border-l-emerald-400" : o.status === "LOST" ? "border-l-4 border-l-rose-300 opacity-70" : ""}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-slate-300" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">{o.title}</div>
                        <div className="mt-0.5 text-xs text-ink-muted">{o.customerName}</div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {o.destinationName ? <span className="chip bg-brand-50 text-brand-700"><MapPin className="h-3 w-3" /> {o.destinationName}</span> : <span />}
                          {o.estValueMinor != null && <span className="text-xs font-bold text-ink">{formatMoney(o.estValueMinor, o.currency || "EUR")}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {stage.opportunities.length === 0 && <div className="py-6 text-center text-xs text-slate-400">Buraya sürükleyin</div>}
              </div>
            </div>
          );
        })}
        {board.length === 0 && <div className="text-sm text-ink-muted">Satış hattı bulunamadı.</div>}
      </div>

      {creating && <CreateModal customers={customers} destinations={destinations} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); router.refresh(); }} />}
      {openOppId && <OpportunityDrawer oppId={openOppId} onClose={() => setOpenOppId(null)} onChanged={() => router.refresh()} />}
    </div>
  );
}

function CreateModal({ customers, destinations, onClose, onCreated }: { customers: CustomerLite[]; destinations: DestLite[]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [estValueEur, setEstValueEur] = useState("");
  const [date, setDate] = useState("");
  const [destinationSlug, setDestinationSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [, start] = useTransition();

  function submit() {
    setBusy(true); setErr("");
    start(async () => {
      const r = await createOpportunityAction({ title, customerId, estValueEur: estValueEur ? Number(estValueEur) : undefined, expectedTravelDate: date || undefined, destinationSlug: destinationSlug || undefined });
      setBusy(false);
      if (r.ok) onCreated(); else setErr(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="card relative w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-ink">Yeni Fırsat</h3><button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button></div>
        <div className="space-y-3">
          <label className="block"><span className="label">Başlık</span><input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Örn. Ahmet Yılmaz — Mısır" /></label>
          <label className="block"><span className="label">Müşteri</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="input">
              <option value="">— seçin —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.email}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="label">Tahmini Değer (EUR)</span><input type="number" value={estValueEur} onChange={(e) => setEstValueEur(e.target.value)} className="input" /></label>
            <label className="block"><span className="label">Seyahat Tarihi</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></label>
          </div>
          <label className="block"><span className="label">Destinasyon (ops.)</span>
            <select value={destinationSlug} onChange={(e) => setDestinationSlug(e.target.value)} className="input">
              <option value="">—</option>
              {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.nameTr}</option>)}
            </select>
          </label>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button onClick={submit} disabled={busy || !title.trim() || !customerId} className="btn-primary w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Oluştur</button>
        </div>
      </div>
    </div>
  );
}
