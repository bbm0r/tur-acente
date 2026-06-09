"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import { addDateAction, deleteDateAction } from "@/app/admin/(panel)/turlar/actions";
import { formatDateRangeTr } from "@/lib/utils";

type DateRow = { id: string; start: string; end: string; quota: number; seatsSold: number; status: string; adultEur: number };

export function DateManager({ tourId, dates }: { tourId: string; dates: DateRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ startDate: "", endDate: "", quota: 30, adultEur: 499, singleEur: 150 });

  function add() {
    setErr("");
    if (!form.startDate || !form.endDate) { setErr("Başlangıç ve bitiş tarihi girin."); return; }
    start(async () => {
      const r = await addDateAction(tourId, form);
      if (r.ok) { setForm({ ...form, startDate: "", endDate: "" }); router.refresh(); }
      else setErr(r.error);
    });
  }
  function remove(dateId: string) {
    setErr("");
    start(async () => {
      const r = await deleteDateAction(tourId, dateId);
      if (r.ok) router.refresh();
      else setErr(r.error);
    });
  }

  return (
    <div className="card p-6">
      <h2 className="mb-4 font-bold text-ink">Kalkış Tarihleri & Fiyatlar</h2>

      {dates.length > 0 && (
        <table className="mb-4 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="py-2">Tarih</th><th className="py-2">Kontenjan</th><th className="py-2">Yetişkin (DBL)</th><th className="py-2">Durum</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dates.map((d) => (
              <tr key={d.id}>
                <td className="py-2 font-medium text-ink">{formatDateRangeTr(d.start, d.end)}</td>
                <td className="py-2 text-ink-soft">{d.seatsSold}/{d.quota}</td>
                <td className="py-2 text-ink-soft">€{d.adultEur}</td>
                <td className="py-2"><span className="chip bg-slate-100 text-ink-muted">{d.status}</span></td>
                <td className="py-2 text-right">
                  <button onClick={() => remove(d.id)} disabled={pending} className="text-ink-muted hover:text-rose-600" title="Sil"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="rounded-xl border border-dashed border-slate-200 p-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <Field label="Başlangıç"><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Bitiş"><input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <Field label="Kontenjan"><input type="number" className="input" value={form.quota} onChange={(e) => setForm({ ...form, quota: Number(e.target.value) })} /></Field>
          <Field label="Yetişkin €"><input type="number" className="input" value={form.adultEur} onChange={(e) => setForm({ ...form, adultEur: Number(e.target.value) })} /></Field>
          <Field label="Tek Kişi Farkı €"><input type="number" className="input" value={form.singleEur} onChange={(e) => setForm({ ...form, singleEur: Number(e.target.value) })} /></Field>
        </div>
        <button onClick={add} disabled={pending} className="btn-primary mt-3">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Kalkış Ekle
        </button>
        <p className="mt-2 text-xs text-ink-muted">Çocuk ve tek kişi fiyatları yetişkin fiyatından otomatik üretilir (çocuk ≈ %72, bebek €75).</p>
      </div>

      {err && <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-600"><AlertCircle className="h-3.5 w-3.5" /> {err}</p>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>{children}</label>;
}
