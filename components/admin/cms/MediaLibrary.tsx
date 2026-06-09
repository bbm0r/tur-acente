"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2, Loader2, ImageIcon } from "lucide-react";
import { MediaUploader } from "./MediaUploader";
import { deleteMediaAction } from "@/app/admin/(panel)/medya/actions";

export function MediaLibrary({ media }: { media: { id: string; fileKey: string; fileName: string; sizeBytes: number }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function del(id: string) {
    setBusyId(id);
    start(async () => {
      await deleteMediaAction(id);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Medya Kütüphanesi</h1>
          <p className="text-sm text-ink-muted">{media.length} görsel · sayfa düzenleyicide kullanılabilir</p>
        </div>
        <MediaUploader onUploaded={() => router.refresh()} />
      </header>

      {media.length === 0 ? (
        <div className="card grid place-items-center gap-2 p-16 text-center text-ink-muted">
          <ImageIcon className="h-8 w-8 text-slate-300" />
          <p>Henüz görsel yüklenmedi. Sağ üstten yükleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((m) => (
            <div key={m.id} className="card overflow-hidden p-0">
              <div className="aspect-square overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.fileKey} alt={m.fileName} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5">
                <span className="truncate text-xs text-ink-soft" title={m.fileName}>{m.fileName}</span>
                <button onClick={() => del(m.id)} disabled={pending} className="shrink-0 text-ink-muted hover:text-rose-600">
                  {busyId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
