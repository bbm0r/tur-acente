"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { updateStatusAction } from "@/app/admin/(panel)/rezervasyonlar/[id]/actions";
import { reservationStatusLabel, reservationStatusColor } from "@/lib/labels";

export function StatusControl({ reservationId, current, allowed }: { reservationId: string; current: string; allowed: string[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const [target, setTarget] = useState<string | null>(null);

  function go(to: string) {
    setErr("");
    setTarget(to);
    start(async () => {
      const r = await updateStatusAction(reservationId, to);
      if (r.ok) router.refresh();
      else setErr(r.error);
      setTarget(null);
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Durum</span>
        <span className={`chip ${reservationStatusColor[current]}`}>{reservationStatusLabel[current]}</span>
      </div>
      {allowed.length === 0 ? (
        <p className="text-xs text-ink-muted">Bu durum nihaidir, geçiş yapılamaz.</p>
      ) : (
        <div className="space-y-2">
          {allowed.map((s) => (
            <button
              key={s}
              onClick={() => go(s)}
              disabled={pending}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50"
            >
              <span>{reservationStatusLabel[s]}</span>
              {pending && target === s ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
      {err && <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-600"><AlertCircle className="h-3.5 w-3.5" /> {err}</p>}
    </div>
  );
}
