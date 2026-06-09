"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, CalendarDays, User, Baby } from "lucide-react";

export function HeroSearch({ destinations }: { destinations: { slug: string; nameTr: string }[] }) {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (date) p.set("tarih", date);
    p.set("yetiskin", String(adults));
    if (children) p.set("cocuk", String(children));
    const qs = p.toString();
    router.push(dest ? `/turlar/${dest}${qs ? `?${qs}` : ""}` : `/turlar${qs ? `?${qs}` : ""}`);
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl2 bg-white/95 p-4 shadow-cardHover ring-1 ring-white/40 backdrop-blur sm:p-5 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]"
    >
      <Field label="Nereye?" icon={<MapPin className="h-4 w-4 text-brand-600" />}>
        <select value={dest} onChange={(e) => setDest(e.target.value)} className="input">
          <option value="">Tüm Destinasyonlar</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>{d.nameTr}</option>
          ))}
        </select>
      </Field>
      <Field label="Kalkış Tarihi" icon={<CalendarDays className="h-4 w-4 text-brand-600" />}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
      </Field>
      <Field label="Yetişkin" icon={<User className="h-4 w-4 text-brand-600" />}>
        <select value={adults} onChange={(e) => setAdults(Number(e.target.value))} className="input">
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
      <Field label="Çocuk" icon={<Baby className="h-4 w-4 text-brand-600" />}>
        <select value={children} onChange={(e) => setChildren(Number(e.target.value))} className="input">
          {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
      <div className="flex items-end">
        <button type="submit" className="btn-accent h-[46px] w-full lg:w-auto">
          <Search className="h-5 w-5" /> Tur Ara
        </button>
      </div>
    </form>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">{icon}{label}</span>
      {children}
    </label>
  );
}
