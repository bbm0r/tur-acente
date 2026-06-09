"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { addNoteAction } from "@/app/admin/(panel)/rezervasyonlar/[id]/actions";

export function NotesPanel({ reservationId, notes }: { reservationId: string; notes: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  function submit() {
    if (!note.trim()) return;
    start(async () => {
      const r = await addNoteAction(reservationId, note);
      if (r.ok) { setNote(""); router.refresh(); }
    });
  }

  return (
    <div>
      {notes ? (
        <pre className="mb-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs text-ink-soft">{notes}</pre>
      ) : (
        <p className="mb-3 text-sm text-ink-muted">Henüz iç not yok.</p>
      )}
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="İç not ekle (yalnızca personel görür)…" className="input min-h-[72px]" />
      <button onClick={submit} disabled={pending || !note.trim()} className="btn-ghost mt-2 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />} Not Ekle
      </button>
    </div>
  );
}
