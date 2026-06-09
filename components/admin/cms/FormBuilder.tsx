"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Trash2, Plus, Loader2, AlertCircle, Inbox, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  FORM_FIELD_TYPE_LABELS, type FormField, type FormFieldType, type FormSettings,
} from "@/lib/blocks";
import { saveFormAction, deleteFormAction } from "@/app/admin/(panel)/formlar/actions";

type FormData = { id: string; name: string; key: string; isActive: boolean; fields: FormField[]; settings: FormSettings };

const FIELD_TYPES: FormFieldType[] = ["text", "email", "tel", "textarea", "select"];

function slugifyKey(s: string) {
  const tr: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
  return (s || "").replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => tr[c]).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "alan";
}

export function FormBuilder({ form, submissionCount }: { form: FormData; submissionCount: number }) {
  const router = useRouter();
  const [name, setName] = useState(form.name);
  const [key, setKey] = useState(form.key);
  const [isActive, setIsActive] = useState(form.isActive);
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [settings, setSettings] = useState<FormSettings>(form.settings);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  function dirty() { setSaved(false); }

  function addField() {
    let k = slugifyKey("alan");
    const existing = new Set(fields.map((f) => f.key));
    for (let i = 2; existing.has(k); i++) k = `alan-${i}`;
    setFields([...fields, { key: k, label: "Yeni Alan", type: "text", required: false }]);
    dirty();
  }
  function updateField(idx: number, patch: Partial<FormField>) {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
    dirty();
  }
  function removeField(idx: number) {
    setFields(fields.filter((_, i) => i !== idx));
    dirty();
  }
  function moveField(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= fields.length) return;
    const copy = fields.slice();
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    setFields(copy);
    dirty();
  }

  function save() {
    setErr("");
    startSave(async () => {
      const r = await saveFormAction(form.id, { name, key, isActive, fields, settings });
      if (r.ok) { setSaved(true); router.refresh(); }
      else setErr(r.error);
    });
  }
  function remove() {
    if (!confirm(`“${name}” formunu ve tüm gönderilerini silmek istiyor musunuz? Bu işlem geri alınamaz.`)) return;
    setErr("");
    startDelete(async () => {
      const r = await deleteFormAction(form.id);
      if (r.ok) router.push("/admin/formlar");
      else setErr(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/formlar" className="text-ink-muted hover:text-ink"><ArrowLeft className="h-5 w-5" /></Link>
          <input value={name} onChange={(e) => { setName(e.target.value); dirty(); }} className="rounded-lg border border-transparent px-2 py-1 text-xl font-extrabold text-ink hover:border-slate-200 focus:border-brand-400 focus:outline-none" />
          <span className={`chip ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{isActive ? "Aktif" : "Pasif"}</span>
          {saved && <span className="text-xs font-medium text-emerald-600">• kaydedildi</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/formlar/${form.id}/gonderiler`} className="btn-ghost px-3 py-2 text-sm"><Inbox className="h-4 w-4" /> Gönderiler ({submissionCount})</Link>
          <button onClick={remove} disabled={deleting} className="btn-ghost px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Sil</button>
          <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet</button>
        </div>
      </div>
      {err && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {err}</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Fields */}
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-bold text-ink">Alanlar</h3>
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col">
                    <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-ink disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                    <button onClick={() => moveField(idx, 1)} disabled={idx === fields.length - 1} className="text-slate-300 hover:text-ink disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                  </div>
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_140px]">
                    <input value={f.label} onChange={(e) => updateField(idx, { label: e.target.value })} placeholder="Etiket" className="input text-sm" />
                    <select value={f.type} onChange={(e) => updateField(idx, { type: e.target.value as FormFieldType })} className="input text-sm">
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{FORM_FIELD_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <button onClick={() => removeField(idx)} title="Alanı sil" className="text-ink-muted hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 pl-8">
                  <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <input type="checkbox" checked={f.required} onChange={(e) => updateField(idx, { required: e.target.checked })} /> Zorunlu
                  </label>
                  {f.type === "select" && (
                    <input
                      value={(f.options ?? []).join(", ")}
                      onChange={(e) => updateField(idx, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      placeholder="Seçenekler (virgülle ayırın)"
                      className="input flex-1 text-xs"
                    />
                  )}
                </div>
              </div>
            ))}
            {fields.length === 0 && <p className="py-3 text-center text-sm text-ink-muted">Alan yok. Aşağıdan ekleyin.</p>}
          </div>
          <button onClick={addField} className="btn-ghost mt-3 w-full text-sm"><Plus className="h-4 w-4" /> Alan Ekle</button>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-bold text-ink">Ayarlar</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="label">Başarı mesajı</span>
                <textarea value={settings.successMessage} onChange={(e) => { setSettings({ ...settings, successMessage: e.target.value }); dirty(); }} className="input min-h-[70px] text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={settings.createLead} onChange={(e) => { setSettings({ ...settings, createLead: e.target.checked }); dirty(); }} /> Gönderiyi CRM’e müşteri adayı olarak ekle
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={settings.notify} onChange={(e) => { setSettings({ ...settings, notify: e.target.checked }); dirty(); }} /> Yeni gönderide bildirim oluştur
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={isActive} onChange={(e) => { setIsActive(e.target.checked); dirty(); }} /> Form aktif (sitede gösterilsin)
              </label>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="mb-2 text-sm font-bold text-ink">Anahtar</h3>
            <input value={key} onChange={(e) => { setKey(e.target.value); dirty(); }} className="input font-mono text-sm" />
            <p className="mt-1.5 text-[11px] text-ink-muted">Sayfa düzenleyicide <b>Form</b> bloğu bu formu bu ada göre seçer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
