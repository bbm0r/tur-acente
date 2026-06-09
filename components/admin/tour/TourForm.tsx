"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { createTourAction, updateTourCoreAction } from "@/app/admin/(panel)/turlar/actions";

type Initial = {
  titleTr: string; destinationId: string; summaryTr: string; descriptionTr: string;
  durationDays: number; durationNights: number; transportType: string; hotelCategory: string;
  visaRequired: boolean; basePriceEur: number; isFeatured: boolean; isCampaign: boolean;
  included: string[]; excluded: string[];
};

const TRANSPORTS = [["FLIGHT", "Uçaklı"], ["BUS", "Otobüslü"], ["CRUISE", "Gemi"], ["MIXED", "Uçak + Tur"], ["OWN_ARRANGEMENT", "Ulaşım Hariç"]];
const HOTELS = [["FIVE_STAR", "5 Yıldız"], ["FOUR_STAR", "4 Yıldız"], ["THREE_STAR", "3 Yıldız"], ["BOUTIQUE", "Butik"], ["NONE", "Yok"]];

export function TourForm({
  destinations,
  mode,
  tourId,
  initial,
}: {
  destinations: { id: string; name: string }[];
  mode: "create" | "edit";
  tourId?: string;
  initial?: Initial;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState<Initial>(
    initial ?? {
      titleTr: "", destinationId: destinations[0]?.id ?? "", summaryTr: "", descriptionTr: "",
      durationDays: 5, durationNights: 4, transportType: "FLIGHT", hotelCategory: "FOUR_STAR",
      visaRequired: false, basePriceEur: 499, isFeatured: false, isCampaign: false,
      included: ["Gidiş-dönüş uçak bileti", "Otel konaklaması", "Transferler", "Rehberlik"], excluded: ["Vize", "Öğle/akşam yemekleri", "Kişisel harcamalar"],
    },
  );
  const [includedText, setIncludedText] = useState((initial?.included ?? f.included).join("\n"));
  const [excludedText, setExcludedText] = useState((initial?.excluded ?? f.excluded).join("\n"));

  function submit() {
    setErr("");
    setSaved(false);
    const payload = {
      ...f,
      included: includedText.split("\n").map((s) => s.trim()).filter(Boolean),
      excluded: excludedText.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    start(async () => {
      const r = mode === "create" ? await createTourAction(payload) : await updateTourCoreAction(tourId!, payload);
      if (r.ok) {
        if (mode === "create") router.push(`/admin/turlar/${r.id}/duzenle`);
        else { setSaved(true); router.refresh(); }
      } else setErr(r.error);
    });
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-ink">Genel Bilgiler</h2>
        <Field label="Tur Başlığı *">
          <input className="input" value={f.titleTr} onChange={(e) => setF({ ...f, titleTr: e.target.value })} placeholder="Sharm El Sheikh 5 Gece Her Şey Dahil" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destinasyon *">
            <select className="input" value={f.destinationId} onChange={(e) => setF({ ...f, destinationId: e.target.value })}>
              {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
          <Field label="Baz Fiyat (kişi başı, EUR) *">
            <input type="number" className="input" value={f.basePriceEur} onChange={(e) => setF({ ...f, basePriceEur: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Kısa Özet *">
          <input className="input" value={f.summaryTr} onChange={(e) => setF({ ...f, summaryTr: e.target.value })} />
        </Field>
        <Field label="Açıklama *">
          <textarea className="input min-h-[120px]" value={f.descriptionTr} onChange={(e) => setF({ ...f, descriptionTr: e.target.value })} />
        </Field>
      </div>

      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Süre (gün)"><input type="number" className="input" value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: Number(e.target.value) })} /></Field>
        <Field label="Süre (gece)"><input type="number" className="input" value={f.durationNights} onChange={(e) => setF({ ...f, durationNights: Number(e.target.value) })} /></Field>
        <Field label="Ulaşım">
          <select className="input" value={f.transportType} onChange={(e) => setF({ ...f, transportType: e.target.value })}>
            {TRANSPORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Otel Kategorisi">
          <select className="input" value={f.hotelCategory} onChange={(e) => setF({ ...f, hotelCategory: e.target.value })}>
            {HOTELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <div className="flex flex-wrap gap-4 sm:col-span-2">
          <Check label="Vize gerekli" checked={f.visaRequired} onChange={(v) => setF({ ...f, visaRequired: v })} />
          <Check label="Öne çıkan" checked={f.isFeatured} onChange={(v) => setF({ ...f, isFeatured: v })} />
          <Check label="Kampanyalı" checked={f.isCampaign} onChange={(v) => setF({ ...f, isCampaign: v })} />
        </div>
      </div>

      <div className="card grid gap-4 p-6 sm:grid-cols-2">
        <Field label="Dahil Hizmetler (her satır bir madde)"><textarea className="input min-h-[120px]" value={includedText} onChange={(e) => setIncludedText(e.target.value)} /></Field>
        <Field label="Hariç Hizmetler (her satır bir madde)"><textarea className="input min-h-[120px]" value={excludedText} onChange={(e) => setExcludedText(e.target.value)} /></Field>
      </div>

      {err && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {err}</div>}
      {saved && <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Kaydedildi.</div>}

      <button onClick={submit} disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {mode === "create" ? "Oluştur ve Devam Et" : "Değişiklikleri Kaydet"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="label">{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
      {label}
    </label>
  );
}
