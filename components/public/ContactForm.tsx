"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { createLeadAction } from "@/app/(public)/iletisim/actions";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    const res = await createLeadAction(form);
    if (res.ok) setState("done");
    else {
      setError(res.error);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <h3 className="text-lg font-bold text-ink">Mesajınız alındı!</h3>
        <p className="text-sm text-ink-muted">Ekibimiz en kısa sürede sizinle iletişime geçecek.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Ad Soyad *</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="block">
          <span className="label">Telefon *</span>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </label>
      </div>
      <label className="block">
        <span className="label">E-posta *</span>
        <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </label>
      <label className="block">
        <span className="label">Mesajınız *</span>
        <textarea className="input min-h-[120px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={state === "loading"} className="btn-primary justify-self-start">
        {state === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</> : <><Send className="h-4 w-4" /> Gönder</>}
      </button>
    </form>
  );
}
