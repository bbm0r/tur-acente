"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { addMenuItemAction, updateMenuItemAction, deleteMenuItemAction, reorderMenuAction } from "@/app/admin/(panel)/menuler/actions";

type Item = { id: string; label: string; url: string };
type Quick = { label: string; url: string };
type Loc = "HEADER" | "FOOTER";

export function MenuBuilder({ header, footer, quick }: { header: Item[]; footer: Item[]; quick: Quick[] }) {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Menüler</h1>
        <p className="text-sm text-ink-muted">Sitenin üst ve alt menülerini düzenleyin — değişiklikler tüm sitede anında yansır.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <MenuSection location="HEADER" title="Üst Menü (Header)" items={header} quick={quick} />
        <MenuSection location="FOOTER" title="Alt Menü (Footer · Kurumsal)" items={footer} quick={quick} />
      </div>
    </div>
  );
}

function MenuSection({ location, title, items, quick }: { location: Loc; title: string; items: Item[]; quick: Quick[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function save(id: string, l: string, u: string) { start(async () => { await updateMenuItemAction(id, l, u); }); }
  function del(id: string) { start(async () => { await deleteMenuItemAction(id); router.refresh(); }); }
  function move(idx: number, dir: -1 | 1) {
    const ids = items.map((i) => i.id);
    const j = idx + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    start(async () => { await reorderMenuAction(location, ids); router.refresh(); });
  }
  function add() {
    if (!label.trim() || !url.trim()) return;
    start(async () => { const r = await addMenuItemAction(location, label, url); if (r.ok) { setLabel(""); setUrl(""); router.refresh(); } });
  }
  function quickPick(v: string) { const q = quick.find((x) => x.url === v); if (q) { setLabel(q.label); setUrl(q.url); } }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-ink">{title}</h2>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />}
      </div>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <ItemRow key={it.id} it={it} first={idx === 0} last={idx === items.length - 1} onSave={save} onDelete={del} onMove={(dir) => move(idx, dir)} />
        ))}
        {items.length === 0 && <p className="py-3 text-center text-sm text-ink-muted">Henüz menü öğesi yok.</p>}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3">
        <div className="mb-2 text-xs font-semibold text-ink-soft">Yeni Öğe Ekle</div>
        <select onChange={(e) => quickPick(e.target.value)} value="" className="input mb-2 text-sm">
          <option value="">Hızlı seç (sayfa / destinasyon)…</option>
          {quick.map((q) => <option key={q.url + q.label} value={q.url}>{q.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Etiket" className="input w-1/3 text-sm" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/baglanti" className="input flex-1 text-sm" />
          <button onClick={add} className="btn-primary px-3 py-2 text-sm"><Plus className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ it, first, last, onSave, onDelete, onMove }: { it: Item; first: boolean; last: boolean; onSave: (id: string, l: string, u: string) => void; onDelete: (id: string) => void; onMove: (dir: -1 | 1) => void }) {
  const [label, setLabel] = useState(it.label);
  const [url, setUrl] = useState(it.url);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
      <div className="flex flex-col">
        <button onClick={() => onMove(-1)} disabled={first} className="text-ink-muted hover:text-ink disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
        <button onClick={() => onMove(1)} disabled={last} className="text-ink-muted hover:text-ink disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
      </div>
      <input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={() => onSave(it.id, label, url)} className="input w-1/3 text-sm" placeholder="Etiket" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => onSave(it.id, label, url)} className="input flex-1 text-sm" placeholder="/baglanti" />
      <button onClick={() => onDelete(it.id)} className="shrink-0 text-ink-muted hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
