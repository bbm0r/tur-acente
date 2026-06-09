"use client";

import { useEffect, useRef, useState, useTransition, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Globe, EyeOff, ExternalLink, Plus, Copy, GripVertical,
  Trash2, Settings2, Loader2, RefreshCw, AlertCircle, Check, X, History,
  AlignLeft, AlignCenter, AlignRight, Search, ChevronUp, ChevronDown, ChevronRight,
} from "lucide-react";
import { BLOCK_DEFS, BLOCK_DEF, BLOCK_GROUPS, STYLE_FIELDS, isContainerType, blockSlots, type Block, type BlockDef, type FieldDef } from "@/lib/blocks";
import { findBlock, setProp, setStyle, removeBlock, appendBlock, insertAfter, moveBlock, cloneWithNewIds } from "@/lib/blockTree";
import { savePageAction, publishPageAction, autosavePageAction } from "@/app/admin/(panel)/sayfalar/actions";
import { MediaPicker } from "./MediaPicker";
import { RevisionHistory } from "./RevisionHistory";
import { RichTextEditor } from "./RichTextEditor";
import type { MediaItem } from "./MediaUploader";

type PageData = { id: string; titleTr: string; slug: string; status: string; seoTitle: string; seoDescription: string; blocks: Block[] };
type OpenMedia = (mode: "single" | "multi", onPick: (urls: string[]) => void) => void;

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `b${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}
function summarize(b: Block) {
  const p = b.props ?? {};
  const raw = String(p.heading || p.title || p.text || p.body || p.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return (raw || BLOCK_DEF[b.type]?.label || b.type).slice(0, 60);
}

export function PageBuilder({ page, destinations, media, forms, isSystem }: { page: PageData; destinations: { slug: string; nameTr: string }[]; media: MediaItem[]; forms: { key: string; name: string }[]; isSystem?: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.titleTr);
  const [slug, setSlug] = useState(page.slug);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle);
  const [seoDescription, setSeoDescription] = useState(page.seoDescription);
  const [blocks, setBlocks] = useState<Block[]>(page.blocks);
  const [status, setStatus] = useState(page.status);
  const [selected, setSelected] = useState<string | null>(page.blocks[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saving, startSave] = useTransition();
  const [pub, startPub] = useTransition();
  const [mediaPicker, setMediaPicker] = useState<{ mode: "single" | "multi"; onPick: (urls: string[]) => void } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [restoreNote, setRestoreNote] = useState("");
  const [tab, setTab] = useState<"content" | "style">("content");
  const [blockQuery, setBlockQuery] = useState("");
  const [addTarget, setAddTarget] = useState<{ parentId: string; slot: string; label: string } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dragIndex = useRef<number | null>(null);
  const inserterRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const published = status === "PUBLISHED";

  function reloadPreview() { try { iframeRef.current?.contentWindow?.location.reload(); } catch { /* not loaded yet */ } }
  // Debounced live preview: persist a draft working copy, then reload the preview iframe.
  function scheduleAutosave(next: Block[]) {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setPreviewBusy(true);
    autosaveTimer.current = setTimeout(async () => {
      await autosavePageAction(page.id, next).catch(() => {});
      reloadPreview();
      setTimeout(() => setPreviewBusy(false), 500);
    }, 700);
  }
  useEffect(() => () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); }, []);

  // Selecting a (different) block always returns the settings panel to the İçerik tab.
  function selectBlock(id: string | null) { setSelected(id); setTab("content"); }
  function mutate(next: Block[]) { setBlocks(next); setDirty(true); scheduleAutosave(next); }
  function addBlock(type: string, target?: { parentId: string; slot: string }) {
    const nb: Block = { id: uid(), type, props: { ...(BLOCK_DEF[type]?.defaults ?? {}) } };
    if (isContainerType(type)) nb.children = {};
    mutate(appendBlock(blocks, target?.parentId ?? null, target?.slot ?? null, nb));
    selectBlock(nb.id);
  }
  function updateProp(id: string, key: string, value: any) { mutate(setProp(blocks, id, key, value)); }
  function updateStyle(id: string, key: string, value: any) { mutate(setStyle(blocks, id, key, value)); }
  function move(id: string, dir: -1 | 1) { mutate(moveBlock(blocks, id, dir)); }
  function duplicate(id: string) {
    const found = findBlock(blocks, id);
    if (!found) return;
    const clone = cloneWithNewIds(found, uid);
    mutate(insertAfter(blocks, id, clone));
    selectBlock(clone.id);
  }
  function remove(id: string) {
    mutate(removeBlock(blocks, id));
    if (selected === id) setSelected(null);
  }
  function addToSlot(parentId: string, slot: string, label: string) {
    setAddTarget({ parentId, slot, label });
    inserterRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function toggleCollapse(id: string) {
    setCollapsed((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function onDrop(target: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === target) return;
    const copy = blocks.slice();
    const [moved] = copy.splice(from, 1);
    copy.splice(target, 0, moved);
    mutate(copy);
  }
  const openMedia: OpenMedia = (mode, onPick) => setMediaPicker({ mode, onPick });

  function save() {
    setErr("");
    startSave(async () => {
      const r = await savePageAction(page.id, { titleTr: title, slug, blocks, seoTitle, seoDescription }, restoreNote || undefined);
      if (r.ok) { setDirty(false); setRestoreNote(""); reloadPreview(); router.refresh(); }
      else setErr(r.error);
    });
  }
  function restoreRevision(data: { title: string; blocks: Block[]; note: string }) {
    setTitle(data.title);
    setBlocks(data.blocks);
    selectBlock(data.blocks[0]?.id ?? null);
    setRestoreNote(data.note);
    setDirty(true);
    setHistoryOpen(false);
  }
  function togglePublish() {
    setErr("");
    startPub(async () => {
      const r = await publishPageAction(page.id, !published);
      if (r.ok) { setStatus(published ? "DRAFT" : "PUBLISHED"); reloadPreview(); }
      else setErr(r.error);
    });
  }

  // Inserter: blocks grouped by category, filtered by the search box, with a "Diğer" catch-all.
  const q = blockQuery.trim().toLocaleLowerCase("tr");
  const matchDef = (d: BlockDef) => !q || d.label.toLocaleLowerCase("tr").includes(q) || (d.hint || "").toLocaleLowerCase("tr").includes(q);
  const assignedTypes = new Set(BLOCK_GROUPS.flatMap((g) => g.types));
  const groupedBlocks = [
    ...BLOCK_GROUPS.map((g) => ({ label: g.label, defs: g.types.map((t) => BLOCK_DEF[t]).filter(Boolean).filter(matchDef) })),
    { label: "Diğer", defs: BLOCK_DEFS.filter((d) => !assignedTypes.has(d.type)).filter(matchDef) },
  ].filter((g) => g.defs.length > 0);

  // Recursive block row — renders a block, its settings panel, and (for containers) its child slots.
  function renderNode(b: Block, idx: number, siblings: Block[], depth: number): ReactElement {
    const def = BLOCK_DEF[b.type];
    const slots = blockSlots(b);
    const container = slots.length > 0;
    const open = !collapsed.has(b.id);
    const childCount = slots.reduce((sum, s) => sum + (b.children?.[s.key]?.length ?? 0), 0);
    const isTop = depth === 0;
    return (
      <div key={b.id} className={`rounded-xl border ${selected === b.id ? "border-brand-400 bg-brand-50/40" : "border-slate-200"}`}>
        <div
          draggable={isTop}
          onDragStart={() => { if (isTop) dragIndex.current = idx; }}
          onDragOver={(e) => { if (isTop) e.preventDefault(); }}
          onDrop={() => { if (isTop) onDrop(idx); }}
          className="flex items-center gap-1 p-2.5"
        >
          {isTop ? <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300" /> : <span className="w-1 shrink-0" />}
          <span className="flex flex-col">
            <button onClick={() => move(b.id, -1)} disabled={idx === 0} className="text-slate-300 hover:text-ink disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
            <button onClick={() => move(b.id, 1)} disabled={idx === siblings.length - 1} className="text-slate-300 hover:text-ink disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
          </span>
          {container && <button onClick={() => toggleCollapse(b.id)} title={open ? "Daralt" : "Genişlet"} className="text-ink-muted hover:text-ink">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>}
          <button onClick={() => selectBlock(selected === b.id ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <Settings2 className="h-4 w-4 shrink-0 text-ink-muted" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-ink">{def?.label ?? b.type}</span>
              <span className="block truncate text-xs text-ink-muted">{container ? `${childCount} blok` : summarize(b)}</span>
            </span>
          </button>
          <button onClick={() => duplicate(b.id)} title="Çoğalt" className="text-ink-muted hover:text-ink"><Copy className="h-3.5 w-3.5" /></button>
          <button onClick={() => remove(b.id)} title="Sil" className="text-ink-muted hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
        </div>
        {selected === b.id && (
          <div className="border-t border-slate-100 p-3">
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button onClick={() => setTab("content")} className={`flex-1 rounded-md py-1.5 ${tab === "content" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}>İçerik</button>
              <button onClick={() => setTab("style")} className={`flex-1 rounded-md py-1.5 ${tab === "style" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}>Stil</button>
            </div>
            {tab === "content" ? (
              <div className="space-y-3">
                {(def?.fields ?? []).length === 0 && <p className="text-xs text-ink-muted">{container ? "İçerik blokları aşağıda. Stil sekmesinden arka plan/boşluk ekleyin." : "Bu blok için içerik ayarı yok. Stil sekmesini deneyin."}</p>}
                {(def?.fields ?? []).map((f) => (
                  <FieldInput key={f.key} docKey={b.id} field={f} value={b.props[f.key]} destinations={destinations} forms={forms} openMedia={openMedia} onChange={(v) => updateProp(b.id, f.key, v)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {STYLE_FIELDS.map((f) => (
                  <FieldInput key={f.key} docKey={b.id} field={f} value={(b.props._style as Record<string, any> | undefined)?.[f.key]} destinations={destinations} forms={forms} openMedia={openMedia} onChange={(v) => updateStyle(b.id, f.key, v)} />
                ))}
              </div>
            )}
          </div>
        )}
        {container && open && (
          <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-2">
            {slots.map((s) => {
              const kids = b.children?.[s.key] ?? [];
              return (
                <div key={s.key} className="rounded-lg border border-dashed border-slate-300 bg-white/60 p-2">
                  <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</div>
                  <div className="space-y-2">
                    {depth < 3 ? kids.map((c, ci) => renderNode(c, ci, kids, depth + 1)) : <p className="px-1 text-[11px] text-ink-muted">Daha derin yerleştirme kapalı.</p>}
                    {kids.length === 0 && depth < 3 && <p className="px-1 py-1 text-[11px] text-ink-muted">Boş — aşağıdan blok ekleyin.</p>}
                  </div>
                  {depth < 3 && (
                    <button onClick={() => addToSlot(b.id, s.key, s.label)} className={`mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-[11px] font-medium transition ${addTarget?.parentId === b.id && addTarget?.slot === s.key ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-300 text-ink-muted hover:border-brand-300 hover:text-brand-700"}`}>
                      <Plus className="h-3 w-3" /> Blok ekle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/sayfalar" className="text-ink-muted hover:text-ink"><ArrowLeft className="h-5 w-5" /></Link>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} className="rounded-lg border border-transparent px-2 py-1 text-xl font-extrabold text-ink hover:border-slate-200 focus:border-brand-400 focus:outline-none" />
          <span className={`chip ${published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{published ? "Yayında" : "Taslak"}</span>
          {dirty && <span className="text-xs font-medium text-amber-600">• kaydedilmedi</span>}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/onizle/${page.id}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-2 text-sm"><ExternalLink className="h-4 w-4" /> Yeni sekmede</a>
          <button onClick={() => setHistoryOpen(true)} className="btn-ghost px-3 py-2 text-sm"><History className="h-4 w-4" /> Geçmiş</button>
          <button onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Kaydet</button>
          <button onClick={togglePublish} disabled={pub} className={`${published ? "btn-ghost" : "btn-accent"} px-4 py-2 text-sm`}>{pub ? <Loader2 className="h-4 w-4 animate-spin" /> : published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}{published ? "Kaldır" : "Yayınla"}</button>
        </div>
      </div>
      {err && <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700"><AlertCircle className="h-4 w-4" /> {err}</div>}
      {restoreNote && <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800"><History className="h-4 w-4" /> {restoreNote} · uygulamak için <b>Kaydet</b>’e basın.</div>}

      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-bold text-ink">Bloklar <span className="font-normal text-ink-muted">· sürükleyerek sıralayın</span></h3>
            <div className="space-y-2">
              {blocks.map((b, idx) => renderNode(b, idx, blocks, 0))}
              {blocks.length === 0 && <p className="py-4 text-center text-sm text-ink-muted">Henüz blok yok. Aşağıdan ekleyin.</p>}
            </div>
          </div>

          <div ref={inserterRef} className="card p-4">
            <h3 className="mb-2 text-sm font-bold text-ink">Blok Ekle</h3>
            {addTarget && (
              <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                <span className="min-w-0 truncate"><b>{addTarget.label}</b> içine ekleniyor</span>
                <button onClick={() => setAddTarget(null)} className="shrink-0 font-semibold text-brand-700 hover:underline">Sayfa köküne dön</button>
              </div>
            )}
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input value={blockQuery} onChange={(e) => setBlockQuery(e.target.value)} placeholder="Blok ara…" className="input py-2 pl-8 text-sm" />
            </div>
            <div className="space-y-3">
              {groupedBlocks.map((g) => (
                <div key={g.label}>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.label}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.defs.map((d) => (
                      <button key={d.type} onClick={() => addBlock(d.type, addTarget ? { parentId: addTarget.parentId, slot: addTarget.slot } : undefined)} className="rounded-xl border border-slate-200 p-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50">
                        <span className="flex items-center gap-1 text-xs font-semibold text-ink"><Plus className="h-3.5 w-3.5 text-brand-600" /> {d.label}</span>
                        <span className="mt-0.5 block text-[11px] text-ink-muted">{d.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {groupedBlocks.length === 0 && <p className="py-4 text-center text-sm text-ink-muted">“{blockQuery}” için blok bulunamadı.</p>}
            </div>
          </div>

          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-bold text-ink">URL & SEO</summary>
            <div className="mt-3 space-y-3">
              <label className="block"><span className="label">URL (slug)</span><div className="flex items-center"><span className="text-sm text-ink-muted">/</span><input value={slug} onChange={(e) => { setSlug(e.target.value); setDirty(true); }} disabled={isSystem} className="input ml-1 disabled:bg-slate-100 disabled:text-ink-muted" /></div>{isSystem && <span className="mt-1 block text-[11px] text-ink-muted">Yasal sayfanın adresi sabittir.</span>}</label>
              <label className="block"><span className="label">SEO Başlık</span><input value={seoTitle} onChange={(e) => { setSeoTitle(e.target.value); setDirty(true); }} className="input" /></label>
              <label className="block"><span className="label">SEO Açıklama</span><textarea value={seoDescription} onChange={(e) => { setSeoDescription(e.target.value); setDirty(true); }} className="input min-h-[70px]" /></label>
            </div>
          </details>
        </div>

        {/* Preview — pinned so it stays in view while editing the (much taller) left column */}
        <div className="card overflow-hidden p-0 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">{previewBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" /> : <Check className="h-3.5 w-3.5 text-emerald-500" />} Canlı önizleme {previewBusy ? "· güncelleniyor…" : "· otomatik"}</span>
            <button onClick={reloadPreview} className="inline-flex items-center gap-1 hover:text-ink"><RefreshCw className="h-3.5 w-3.5" /> Yenile</button>
          </div>
          <iframe ref={iframeRef} src={`/onizle/${page.id}`} className="h-[70vh] w-full bg-white lg:h-[calc(100vh-6.5rem)]" title="Önizleme" />
        </div>
      </div>

      {mediaPicker && (
        <MediaPicker
          media={media}
          mode={mediaPicker.mode}
          onClose={() => setMediaPicker(null)}
          onSelect={(urls) => mediaPicker.onPick(urls)}
        />
      )}

      <RevisionHistory pageId={page.id} open={historyOpen} onClose={() => setHistoryOpen(false)} onRestore={restoreRevision} />
    </div>
  );
}

function FieldInput({ field, value, destinations, forms, openMedia, onChange, docKey }: { field: FieldDef; value: any; destinations: { slug: string; nameTr: string }[]; forms: { key: string; name: string }[]; openMedia: OpenMedia; onChange: (v: any) => void; docKey?: string }) {
  if (field.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-3 py-0.5">
        <span className="text-xs font-medium text-ink-soft">{field.label}</span>
        <button type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${value ? "bg-brand-600" : "bg-slate-300"}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>
    );
  }
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{field.label}</span>
      {field.type === "code" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} spellCheck={false} className="input min-h-[150px] font-mono text-xs" />
      ) : field.type === "richtext" ? (
        <RichTextEditor docKey={docKey} value={value ?? ""} onChange={onChange} />
      ) : field.type === "range" ? (
        <div className="flex items-center gap-2">
          <input type="range" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} value={Number(value) || 0} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-brand-600" />
          <span className="w-9 text-right text-xs text-ink-muted">{Number(value) || 0}</span>
        </div>
      ) : field.type === "color" ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {["", "#0d9488", "#f59e0b", "#0f172a", "#ffffff", "#f1f5f9", "#fee2e2", "#dbeafe", "#dcfce7"].map((c) => (
            <button key={c || "none"} type="button" title={c || "Yok"} onClick={() => onChange(c)} className={`grid h-6 w-6 place-items-center rounded-md border ${value === c ? "ring-2 ring-brand-500 ring-offset-1" : "border-slate-200"}`} style={c ? { backgroundColor: c } : undefined}>
              {!c && <X className="h-3 w-3 text-slate-400" />}
            </button>
          ))}
          <input type="color" value={value && value !== "" ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-6 w-8 cursor-pointer rounded border border-slate-200 bg-white p-0.5" title="Özel renk" />
        </div>
      ) : field.type === "align" ? (
        <div className="flex gap-1">
          {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([v, Icon]) => (
            <button key={v} type="button" onClick={() => onChange(v)} className={`flex-1 rounded-lg border p-1.5 ${value === v ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 text-ink-muted hover:bg-slate-50"}`}>
              <Icon className="mx-auto h-4 w-4" />
            </button>
          ))}
        </div>
      ) : field.type === "textarea" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input min-h-[80px] text-sm" />
      ) : field.type === "number" ? (
        <input type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="input text-sm" />
      ) : field.type === "select" ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input text-sm">
          {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : field.type === "destination" ? (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input text-sm">
          <option value="">— seçin —</option>
          {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.nameTr}</option>)}
        </select>
      ) : field.type === "form" ? (
        forms.length === 0 ? (
          <p className="text-xs text-ink-muted">Henüz form yok. Önce <b>Formlar</b> bölümünden bir form oluşturun.</p>
        ) : (
          <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input text-sm">
            <option value="">— form seçin —</option>
            {forms.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
          </select>
        )
      ) : field.type === "image" ? (
        <div className="space-y-2">
          {value ? (
            <div className="relative">
              <img src={value} alt="" className="h-24 w-full rounded-lg object-cover" />
              <button type="button" onClick={() => onChange("")} title="Görseli kaldır" className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white transition hover:bg-rose-600"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="URL veya kütüphaneden seç" className="input flex-1 text-sm" />
            <button type="button" onClick={() => openMedia("single", (urls) => onChange(urls[0] ?? ""))} className="btn-ghost shrink-0 px-3 py-2 text-xs">Kütüphane</button>
            {value && <button type="button" onClick={() => onChange("")} title="Kaldır" className="btn-ghost shrink-0 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>
        </div>
      ) : field.type === "images" ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {(Array.isArray(value) ? value : []).map((src: string, i: number) => (
              <div key={i} className="relative">
                <img src={src} alt="" className="h-16 w-full rounded object-cover" />
                <button type="button" onClick={() => onChange((value as string[]).filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => openMedia("multi", (urls) => onChange([...(Array.isArray(value) ? value : []), ...urls]))} className="btn-ghost w-full text-xs">+ Görsel Ekle</button>
        </div>
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="input text-sm" />
      )}
      {field.help && <span className="mt-0.5 block text-[11px] text-ink-muted">{field.help}</span>}
    </label>
  );
}
