"use client";

import { useState } from "react";
import { X, Check, ImageIcon } from "lucide-react";
import { MediaUploader, type MediaItem } from "./MediaUploader";

export function MediaPicker({
  media,
  mode,
  onClose,
  onSelect,
}: {
  media: MediaItem[];
  mode: "single" | "multi";
  onClose: () => void;
  onSelect: (urls: string[]) => void;
}) {
  const [list, setList] = useState<MediaItem[]>(media);
  const [sel, setSel] = useState<string[]>([]);

  function pick(url: string) {
    if (mode === "single") {
      onSelect([url]);
      onClose();
      return;
    }
    setSel((s) => (s.includes(url) ? s.filter((x) => x !== url) : [...s, url]));
  }

  function onUploaded(m: MediaItem) {
    setList((l) => [m, ...l]);
    if (mode === "single") {
      onSelect([m.fileKey]);
      onClose();
    } else {
      setSel((s) => [...s, m.fileKey]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="card flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="flex items-center gap-2 font-bold text-ink"><ImageIcon className="h-5 w-5 text-brand-600" /> Görsel Kütüphanesi</h3>
          <div className="flex items-center gap-3">
            <MediaUploader onUploaded={onUploaded} label="Yükle" />
            <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {list.length === 0 ? (
            <div className="grid place-items-center gap-2 py-16 text-center text-ink-muted">
              <ImageIcon className="h-8 w-8 text-slate-300" />
              <p>Henüz görsel yok. Sağ üstten yükleyin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {list.map((m) => {
                const selected = sel.includes(m.fileKey);
                return (
                  <button key={m.id} onClick={() => pick(m.fileKey)} className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${selected ? "border-brand-600" : "border-transparent hover:border-slate-200"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.fileKey} alt={m.fileName} className="h-full w-full object-cover" />
                    {selected && <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-white"><Check className="h-4 w-4" /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {mode === "multi" && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <span className="text-sm text-ink-muted">{sel.length} seçili</span>
            <button onClick={() => { onSelect(sel); onClose(); }} disabled={sel.length === 0} className="btn-primary">Seç</button>
          </div>
        )}
      </div>
    </div>
  );
}
