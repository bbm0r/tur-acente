"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import type { FormField } from "@/lib/blocks";
import { submitFormAction } from "@/app/(public)/formlar/actions";

export function DynamicForm({ formKey, fields }: { formKey: string; fields: FormField[] }) {
  const init: Record<string, string> = {};
  fields.forEach((f) => (init[f.key] = ""));
  const [values, setValues] = useState<Record<string, string>>(init);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    const res = await submitFormAction(formKey, values);
    if (res.ok) {
      setMessage(res.message);
      setState("done");
    } else {
      setError(res.error);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <h3 className="text-lg font-bold text-ink">Teşekkürler!</h3>
        <p className="text-sm text-ink-muted">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6">
      {fields.map((f) => (
        <label key={f.key} className="block">
          <span className="label">{f.label}{f.required && " *"}</span>
          {f.type === "textarea" ? (
            <textarea className="input min-h-[120px]" value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} required={f.required} />
          ) : f.type === "select" ? (
            <select className="input" value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} required={f.required}>
              <option value="">— seçin —</option>
              {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type={f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"}
              className="input"
              value={values[f.key] ?? ""}
              onChange={(e) => set(f.key, e.target.value)}
              required={f.required}
            />
          )}
        </label>
      ))}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={state === "loading"} className="btn-primary justify-self-start">
        {state === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</> : <><Send className="h-4 w-4" /> Gönder</>}
      </button>
    </form>
  );
}
