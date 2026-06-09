"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toggleFavoriteAction } from "@/app/(account)/hesabim/actions";

export function FavoriteButton({ tourId, initial, variant = "icon" }: { tourId: string; initial?: boolean; variant?: "icon" | "full" }) {
  const router = useRouter();
  const [fav, setFav] = useState(!!initial);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    start(async () => {
      const r = await toggleFavoriteAction(tourId);
      if (!r.ok) {
        router.push(`/hesap/giris?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setFav(r.favorited);
      router.refresh();
    });
  }

  if (variant === "full") {
    return (
      <button onClick={toggle} disabled={pending} className={`btn w-full ${fav ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200" : "btn-ghost"}`}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={`h-5 w-5 ${fav ? "fill-rose-500 text-rose-500" : ""}`} />}
        {fav ? "Favorilerde" : "Favorilere Ekle"}
      </button>
    );
  }

  return (
    <button onClick={toggle} disabled={pending} aria-label="Favorilere ekle" className="grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 backdrop-blur transition hover:bg-white">
      {pending ? <Loader2 className="h-4 w-4 animate-spin text-ink-muted" /> : <Heart className={`h-4 w-4 ${fav ? "fill-rose-500 text-rose-500" : "text-ink-muted"}`} />}
    </button>
  );
}
