"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { assignAgentAction } from "@/app/admin/(panel)/rezervasyonlar/[id]/actions";

export function AssignControl({
  reservationId,
  current,
  staff,
}: {
  reservationId: string;
  current: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(id: string) {
    start(async () => {
      const r = await assignAgentAction(reservationId, id);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Sorumlu Temsilci</span>
        {pending && <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />}
      </div>
      <select value={current ?? ""} onChange={(e) => onChange(e.target.value)} disabled={pending} className="input">
        <option value="">— Atanmadı —</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
}
