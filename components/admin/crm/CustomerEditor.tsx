"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Globe2, Pencil, X, Plus, Loader2, ShieldCheck, Tag as TagIcon, Save } from "lucide-react";
import { formatDateTr } from "@/lib/utils";
import { updateCustomerAction, addCustomerTagAction, removeCustomerTagAction } from "@/app/admin/(panel)/musteriler/actions";

type Staff = { id: string; firstName: string; lastName: string };
type TagLite = { tagId: string; name: string; color: string | null };
type Cust = { id: string; firstName: string; lastName: string; email: string; phone: string; city: string | null; nationality: string | null; notes: string | null; lifecycleStage: string; ownerId: string | null; marketingConsent: boolean; kvkkConsentAt: string | null };

const LIFECYCLE: Record<string, { label: string; cls: string }> = {
  SUBSCRIBER: { label: "Abone", cls: "bg-slate-100 text-slate-600" },
  LEAD: { label: "Aday", cls: "bg-amber-100 text-amber-800" },
  OPPORTUNITY: { label: "Fırsat", cls: "bg-sky-100 text-sky-800" },
  CUSTOMER: { label: "Müşteri", cls: "bg-emerald-100 text-emerald-700" },
  REPEAT_CUSTOMER: { label: "Tekrar Müşteri", cls: "bg-emerald-100 text-emerald-700" },
  LOST: { label: "Kayıp", cls: "bg-rose-100 text-rose-700" },
};

export function CustomerEditor({ customer, staff, tags }: { customer: Cust; staff: Staff[]; tags: TagLite[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [f, setF] = useState({ ...customer });

  function save() {
    setErr("");
    start(async () => {
      const r = await updateCustomerAction(customer.id, { firstName: f.firstName, lastName: f.lastName, phone: f.phone, city: f.city ?? "", nationality: f.nationality ?? "", notes: f.notes ?? "", lifecycleStage: f.lifecycleStage, ownerId: f.ownerId ?? "", marketingConsent: f.marketingConsent });
      if (r.ok) { setEditing(false); router.refresh(); } else setErr(r.error);
    });
  }
  function addTag() { if (!tagInput.trim()) return; start(async () => { await addCustomerTagAction(customer.id, tagInput); setTagInput(""); router.refresh(); }); }
  function removeTag(tagId: string) { start(async () => { await removeCustomerTagAction(customer.id, tagId); router.refresh(); }); }

  const lc = LIFECYCLE[customer.lifecycleStage] ?? LIFECYCLE.LEAD;

  if (editing) {
    return (
      <div className="card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <L label="Ad"><input value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="input" /></L>
          <L label="Soyad"><input value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="input" /></L>
          <L label="Telefon"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="input" /></L>
          <L label="Şehir"><input value={f.city ?? ""} onChange={(e) => setF({ ...f, city: e.target.value })} className="input" /></L>
          <L label="Uyruk"><input value={f.nationality ?? ""} onChange={(e) => setF({ ...f, nationality: e.target.value })} className="input" /></L>
          <L label="Yaşam Döngüsü"><select value={f.lifecycleStage} onChange={(e) => setF({ ...f, lifecycleStage: e.target.value })} className="input">{Object.entries(LIFECYCLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></L>
          <L label="Temsilci"><select value={f.ownerId ?? ""} onChange={(e) => setF({ ...f, ownerId: e.target.value })} className="input"><option value="">—</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></L>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft"><input type="checkbox" checked={f.marketingConsent} onChange={(e) => setF({ ...f, marketingConsent: e.target.checked })} /> Pazarlama izni</label>
        </div>
        <L label="Notlar"><textarea value={f.notes ?? ""} onChange={(e) => setF({ ...f, notes: e.target.value })} className="input min-h-[70px]" /></L>
        {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-sm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet</button>
          <button onClick={() => { setEditing(false); setF({ ...customer }); }} className="btn-ghost px-4 py-2 text-sm">İptal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{customer.firstName} {customer.lastName}</h1>
            <span className={`chip ${lc.cls}`}>{lc.label}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>
            <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>
            {customer.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {customer.city}</span>}
            {customer.nationality && <span className="flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> {customer.nationality}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {(() => { const o = staff.find((s) => s.id === customer.ownerId); return o ? <span className="chip bg-violet-100 text-violet-700">Temsilci: {o.firstName} {o.lastName}</span> : null; })()}
            <span className={`chip ${customer.marketingConsent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>Pazarlama: {customer.marketingConsent ? "İzinli" : "İzinsiz"}</span>
            {customer.kvkkConsentAt && <span className="chip bg-slate-100 text-ink-muted"><ShieldCheck className="h-3 w-3" /> KVKK {formatDateTr(customer.kvkkConsentAt)}</span>}
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="btn-ghost shrink-0 px-3 py-2 text-sm"><Pencil className="h-4 w-4" /> Düzenle</button>
      </div>
      {customer.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-ink-soft">{customer.notes}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TagIcon className="h-4 w-4 text-ink-muted" />
        {tags.map((t) => <span key={t.tagId} className="chip bg-indigo-100 text-indigo-700">{t.name}<button onClick={() => removeTag(t.tagId)} className="ml-1 hover:text-rose-600"><X className="h-3 w-3" /></button></span>)}
        <span className="inline-flex items-center gap-1">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Etiket ekle" className="input h-7 w-28 text-xs" />
          <button onClick={addTag} disabled={busy || !tagInput.trim()} className="text-brand-600 hover:text-brand-700 disabled:opacity-40"><Plus className="h-4 w-4" /></button>
        </span>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}
