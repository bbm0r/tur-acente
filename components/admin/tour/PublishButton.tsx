"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, EyeOff } from "lucide-react";
import { setPublishedAction } from "@/app/admin/(panel)/turlar/actions";

export function PublishButton({ tourId, status }: { tourId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const published = status === "PUBLISHED";

  function toggle() {
    setErr("");
    start(async () => {
      const r = await setPublishedAction(tourId, !published);
      if (r.ok) router.refresh();
      else setErr(r.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={toggle} disabled={pending} className={published ? "btn-ghost" : "btn-accent"}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : published ? <EyeOff className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        {published ? "Yayından Kaldır" : "Yayınla"}
      </button>
      {err && <span className="max-w-[200px] text-right text-xs text-rose-600">{err}</span>}
    </div>
  );
}
