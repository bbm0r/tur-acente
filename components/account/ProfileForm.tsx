"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { updateProfileAction } from "@/app/(account)/hesabim/actions";

type Initial = { firstName: string; lastName: string; email: string; phone: string; marketingConsent: boolean };

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setDone(false);
    start(async () => {
      const r = await updateProfileAction({ firstName: form.firstName, lastName: form.lastName, phone: form.phone, marketingConsent: form.marketingConsent });
      if (r.ok) { setDone(true); router.refresh(); }
      else setErr(r.error);
    });
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-bold text-ink">Profil Bilgileri</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label">Ad</span><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input" /></label>
        <label className="block"><span className="label">Soyad</span><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input" /></label>
      </div>
      <label className="block"><span className="label">E-posta</span><input value={form.email} disabled className="input bg-slate-100 text-ink-muted" /><span className="mt-1 block text-[11px] text-ink-muted">E-posta değiştirilemez.</span></label>
      <label className="block"><span className="label">Telefon</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></label>

      <label className="flex items-start gap-2 text-sm text-ink-soft">
        <input type="checkbox" checked={form.marketingConsent} onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-slate-300" />
        <span>Kampanya ve fırsatlardan e-posta ile haberdar olmak istiyorum (KVKK kapsamında açık rıza).</span>
      </label>

      {err && <p className="flex items-center gap-1.5 text-sm text-rose-600"><AlertCircle className="h-4 w-4" /> {err}</p>}
      {done && <p className="flex items-center gap-1.5 text-sm text-emerald-600"><Check className="h-4 w-4" /> Bilgileriniz güncellendi.</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Kaydet</button>
    </form>
  );
}
