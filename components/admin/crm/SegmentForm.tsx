"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createSegmentAction } from "@/app/admin/(panel)/pazarlama/actions";
import { lifecycleLabel } from "@/lib/labels";

type Tag = { id: string; name: string };

export function SegmentForm({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [lifecycle, setLifecycle] = useState("");
  const [tagId, setTagId] = useState("");
  const [consentOnly, setConsentOnly] = useState(true);
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    start(async () => {
      const r = await createSegmentAction({ name, filter: { lifecycle: lifecycle || undefined, tagId: tagId || undefined, consentOnly } });
      if (r.ok) { setName(""); setLifecycle(""); setTagId(""); router.refresh(); } else setErr(r.error);
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Segment adı (örn. İzinli Müşteriler)" className="input text-sm" />
        <select value={lifecycle} onChange={(e) => setLifecycle(e.target.value)} className="input text-sm"><option value="">Tüm aşamalar</option>{Object.entries(lifecycleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={tagId} onChange={(e) => setTagId(e.target.value)} className="input text-sm"><option value="">Etiket filtresi yok</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} /> Yalnızca pazarlama izinliler (KVKK)</label>
      </div>
      {err && <p className="mt-1 text-sm text-rose-600">{err}</p>}
      <button onClick={submit} disabled={busy || !name.trim()} className="btn-primary mt-2 px-3 py-2 text-xs">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Segment Oluştur</button>
    </div>
  );
}
