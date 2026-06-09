"use client";

import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Link2, Quote, RemoveFormatting } from "lucide-react";

/**
 * Lightweight contentEditable WYSIWYG → emits HTML.
 * `docKey` (the owning block id) resets the editor content when you switch blocks,
 * while typing within one block stays uncontrolled (no cursor jumps).
 */
export function RichTextEditor({ value, onChange, docKey }: { value: string; onChange: (html: string) => void; docKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) ref.current.innerHTML = value || "";
    // Only re-sync when the selected block changes — not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  function emit() {
    if (ref.current) onChange(ref.current.innerHTML);
  }
  function exec(cmd: string, arg?: string) {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    emit();
  }
  function addLink() {
    const url = prompt("Bağlantı adresi (URL):", "https://");
    if (url) exec("createLink", url);
  }

  function Btn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
      <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className="grid h-7 w-7 place-items-center rounded text-ink-soft hover:bg-slate-100">
        {children}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 p-1">
        <Btn onClick={() => exec("bold")} title="Kalın"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("italic")} title="İtalik"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("underline")} title="Altı çizili"><Underline className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Btn onClick={() => exec("formatBlock", "<h2>")} title="Başlık 2"><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("formatBlock", "<h3>")} title="Başlık 3"><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("formatBlock", "<blockquote>")} title="Alıntı"><Quote className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Btn onClick={() => exec("insertUnorderedList")} title="Madde liste"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => exec("insertOrderedList")} title="Numaralı liste"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={addLink} title="Bağlantı ekle"><Link2 className="h-3.5 w-3.5" /></Btn>
        <span className="mx-1 h-4 w-px bg-slate-200" />
        <Btn onClick={() => exec("removeFormat")} title="Biçimi temizle"><RemoveFormatting className="h-3.5 w-3.5" /></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        className="min-h-[130px] max-w-none p-3 text-sm leading-relaxed text-ink focus:outline-none [&_a]:text-brand-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
