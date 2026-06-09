"use client";

import { useEffect, useState } from "react";
import { History, X, Eye, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { formatDateTimeTr } from "@/lib/utils";
import {
  listPageRevisionsAction,
  getPageRevisionAction,
  type RevisionSummary,
} from "@/app/admin/(panel)/sayfalar/actions";
import type { Block } from "@/lib/blocks";

export function RevisionHistory({
  pageId,
  open,
  onClose,
  onRestore,
}: {
  pageId: string;
  open: boolean;
  onClose: () => void;
  onRestore: (data: { title: string; blocks: Block[]; note: string }) => void;
}) {
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  // Re-fetch each time the drawer opens — a save just before opening adds a new revision.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setErr("");
    listPageRevisionsAction(pageId)
      .then((rows) => { if (active) setRevisions(rows); })
      .catch(() => { if (active) setErr("Sürümler yüklenemedi."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, pageId]);

  async function load(rev: RevisionSummary) {
    setErr("");
    setRestoringId(rev.id);
    const r = await getPageRevisionAction(pageId, rev.id);
    setRestoringId(null);
    if (!r.ok) { setErr(r.error); return; }
    onRestore({
      title: r.title,
      blocks: (r.blocks as Block[]) ?? [],
      note: `${formatDateTimeTr(rev.createdAt)} sürümünden geri yüklendi`,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink"><History className="h-5 w-5 text-brand-600" /> Sürüm Geçmişi</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="h-5 w-5" /></button>
        </header>

        {err && <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {err}</div>}

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…</div>}
          {!loading && revisions && revisions.length === 0 && (
            <p className="py-12 text-center text-sm text-ink-muted">Henüz kayıtlı sürüm yok. Sayfayı kaydettikçe burada birikir.</p>
          )}
          {!loading && revisions && revisions.length > 0 && (
            <ol className="space-y-2">
              {revisions.map((rev, i) => (
                <li key={rev.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {formatDateTimeTr(rev.createdAt)}
                    {i === 0 && <span className="chip bg-emerald-100 text-emerald-700">güncel</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">{rev.editorName ?? "Bilinmiyor"} · {rev.blockCount} blok</p>
                  {rev.note && <p className="mt-1 text-xs italic text-ink-soft">{rev.note}</p>}
                  <div className="mt-2.5 flex items-center gap-2">
                    <a href={`/onizle/${pageId}?rev=${rev.id}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> Önizle</a>
                    <button onClick={() => load(rev)} disabled={restoringId === rev.id} className="btn-ghost px-3 py-1.5 text-xs">
                      {restoringId === rev.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Bu sürümü yükle
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <footer className="border-t border-slate-100 px-5 py-3 text-[11px] text-ink-muted">
          “Yükle” seçilen sürümü düzenleyiciye getirir; uygulamak için <b>Kaydet</b>’e basın. Mevcut içerik kaybolmaz — her kayıt yeni bir sürüm oluşturur.
        </footer>
      </aside>
    </div>
  );
}
