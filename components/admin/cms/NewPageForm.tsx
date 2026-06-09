"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { createPageAction } from "@/app/admin/(panel)/sayfalar/actions";

export function NewPageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    start(async () => {
      const r = await createPageAction(title);
      if (r.ok) router.push(`/admin/sayfalar/${r.id}`);
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="card max-w-lg space-y-4 p-6">
      <label className="block">
        <span className="label">Sayfa Başlığı</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Erken Rezervasyon Kampanyası" className="input" autoFocus />
        <span className="mt-1 block text-xs text-ink-muted">URL otomatik oluşturulur, sonra düzenleyebilirsiniz.</span>
      </label>
      {err && <p className="flex items-center gap-1.5 text-sm text-rose-600"><AlertCircle className="h-4 w-4" /> {err}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Oluştur ve Düzenle
      </button>
    </form>
  );
}
