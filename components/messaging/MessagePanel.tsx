"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export type MessageDTO = {
  id: string;
  direction: "IN" | "OUT";
  body: string;
  createdAtLabel: string;
  senderName: string | null;
};

type ActionResult = { ok: true } | { ok: false; error: string };

export function MessagePanel({
  messages,
  perspective,
  action,
  boundArg,
}: {
  messages: MessageDTO[];
  perspective: "customer" | "staff";
  action: (arg: string, body: string) => Promise<ActionResult>;
  boundArg: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  // "mine" = the side the current viewer sends from.
  // customer sends IN (→ agency); staff sends OUT (→ customer).
  const mineDir = perspective === "customer" ? "IN" : "OUT";

  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setError(null);
    start(async () => {
      const r = await action(boundArg, text);
      if (r.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-3 max-h-96 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            {perspective === "customer"
              ? "Henüz mesaj yok. Rezervasyonunuzla ilgili acenteye ilk mesajınızı gönderin."
              : "Henüz mesaj yok."}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.direction === mineDir;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-ink"
                  }`}
                >
                  {m.body}
                </div>
                <div className="mt-1 px-1 text-[11px] text-ink-muted">
                  {nameFor(m, perspective, mine)} · {m.createdAtLabel}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-2 focus-within:border-brand-300">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          placeholder={perspective === "customer" ? "Acenteye bir mesaj yazın…" : "Müşteriye yanıt yazın…"}
          className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-muted"
          rows={3}
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <span className="text-[11px] text-ink-muted">⌘/Ctrl + Enter ile gönder</span>
          <button onClick={submit} disabled={pending || !body.trim()} className="btn-primary text-sm">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {perspective === "customer" ? "Gönder" : "Yanıtla"}
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

function nameFor(m: MessageDTO, perspective: "customer" | "staff", mine: boolean) {
  if (perspective === "customer") return mine ? "Siz" : m.senderName ?? "Acente";
  return mine ? m.senderName ?? "Siz" : "Müşteri";
}
