import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { listTours, getDestinationsWithCounts } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/auth";
import { getFavoriteTourIds } from "@/lib/account";
import { TourCard } from "@/components/public/TourCard";

export const metadata: Metadata = {
  title: "Tüm Turlar",
  description: "Mısır, Moskova, İtalya, Benelüks ve Yunanistan paket turlarını keşfedin. Şeffaf fiyat, müsait tarihler.",
};

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kampanya?: string }>;
}) {
  const sp = await searchParams;
  const campaign = sp.kampanya === "1";
  const [tours, destinations] = await Promise.all([
    listTours({ q: sp.q, campaign }),
    getDestinationsWithCounts(),
  ]);
  const me = await getCustomerUser();
  const favIds = me?.customerId ? await getFavoriteTourIds(me.customerId) : new Set<string>();

  return (
    <div className="bg-slate-50">
      <div className="border-b border-slate-100 bg-white">
        <div className="container-page py-10">
          <h1 className="text-3xl font-extrabold text-ink">
            {campaign ? "Kampanyalı Turlar" : "Tüm Turlar"}
          </h1>
          <p className="mt-1.5 text-ink-muted">
            {tours.length} tur listeleniyor · şeffaf fiyat, müsait tarihler
          </p>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Link href="/turlar" className={chip(!sp.q && !campaign)}>Tümü</Link>
            {destinations.map((d) => (
              <Link key={d.slug} href={`/turlar/${d.slug}`} className={chip(false)}>
                {d.nameTr} <span className="text-ink-muted">({d.tourCount})</span>
              </Link>
            ))}
            <Link href="/turlar?kampanya=1" className={chip(campaign)}>🔥 Kampanyalar</Link>
          </div>

          <form action="/turlar" method="get" className="mt-4 flex max-w-md gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Tur veya destinasyon ara…" className="input pl-9" />
            </div>
            <button type="submit" className="btn-primary">Ara</button>
          </form>
        </div>
      </div>

      <div className="container-page py-10">
        {tours.length === 0 ? (
          <div className="card grid place-items-center gap-2 p-16 text-center">
            <SlidersHorizontal className="h-8 w-8 text-slate-300" />
            <p className="font-semibold text-ink">Sonuç bulunamadı</p>
            <p className="text-sm text-ink-muted">Farklı bir destinasyon veya arama deneyin.</p>
            <Link href="/turlar" className="btn-ghost mt-2">Tüm turları gör</Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t as any} favorited={favIds.has(t.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return `chip ring-1 transition ${
    active ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink-soft ring-slate-200 hover:bg-slate-100"
  }`;
}
