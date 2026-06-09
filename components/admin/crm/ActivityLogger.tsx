"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { logActivityAction } from "@/app/admin/(panel)/crm/actions";

const TYPES: [string, string][] = [["NOTE", "Not"], ["CALL", "Arama"], ["EMAIL", "E-posta"], ["WHATSAPP", "WhatsApp"], ["MEETING", "Görüşme"], ["TASK", "Görev"]];

export function ActivityLogger({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [type, setType] = useState("NOTE");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [busy, start] = useTransition();

  function add() {
    if (!subject.trim()) return;
    start(async () => {
      const r = await logActivityAction({ customerId, type, subject, body, dueAt: dueAt || undefined });
      if (r.ok) { setSubject(""); setBody(""); setDueAt(""); router.refresh(); }
    });
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="input h-9 w-28 text-xs">{TYPES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Konu (örn. Müşteri arandı)" className="input h-9 min-w-[160px] flex-1 text-sm" />
        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} title="Son tarih → takip görevi oluşturur" className="input h-9 w-36 text-xs" />
        <button onClick={add} disabled={busy || !subject.trim()} className="btn-primary h-9 px-3 text-xs">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ekle</button>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detay / not (ops.)" className="input mt-2 min-h-[50px] text-sm" />
      <p className="mt-1 text-[11px] text-ink-muted">Tarih girerseniz <b>Görevler</b>’de takip olarak görünür.</p>
    </div>
  );
}
