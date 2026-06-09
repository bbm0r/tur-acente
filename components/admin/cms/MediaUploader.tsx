"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

export type MediaItem = { id: string; fileKey: string; fileName: string };

export function MediaUploader({ onUploaded, label = "Görsel Yükle" }: { onUploaded?: (m: MediaItem) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/admin/medya/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.ok) onUploaded?.(data.media);
      else setErr(data.error || "Yükleme başarısız");
    } catch {
      setErr("Yükleme başarısız");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="btn-primary">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {label}
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
    </div>
  );
}
