"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deletePageAction } from "@/app/admin/(panel)/sayfalar/actions";

export function DeletePageButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");

  function onDelete() {
    if (!confirm(`“${title}” sayfasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    setErr("");
    start(async () => {
      const r = await deletePageAction(id);
      if (r.ok) router.refresh();
      else setErr(r.error);
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title={err || "Sayfayı sil"}
      className={`inline-flex items-center gap-1 text-sm ${err ? "text-rose-600" : "text-ink-muted hover:text-rose-600"}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Sil
    </button>
  );
}
