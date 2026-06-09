import Link from "next/link";
import { Plus, ExternalLink, Star, Flame } from "lucide-react";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { transportLabel } from "@/lib/labels";

const tourStatusLabel: Record<string, string> = { DRAFT: "Taslak", PUBLISHED: "Yayında", HIDDEN: "Gizli", ARCHIVED: "Arşiv" };
const tourStatusColor: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  HIDDEN: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

export default async function AdminTours() {
  const tours = await db.tour.findMany({
    include: { destination: true, _count: { select: { tourDates: true } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Turlar</h1>
          <p className="text-sm text-ink-muted">{tours.length} tur · içerik, tarih ve fiyat yönetimi</p>
        </div>
        <Link href="/admin/turlar/yeni" className="btn-primary">
          <Plus className="h-4 w-4" /> Yeni Tur
        </Link>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Tur</th>
                <th className="px-4 py-3">Destinasyon</th>
                <th className="px-4 py-3">Ulaşım</th>
                <th className="px-4 py-3">Kalkış</th>
                <th className="px-4 py-3">Baz Fiyat</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tours.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{t.titleTr}</span>
                      {t.isFeatured && <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" />}
                      {t.isCampaign && <Flame className="h-3.5 w-3.5 text-rose-500" />}
                    </div>
                    <div className="text-xs text-ink-muted">/{t.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{t.destination.nameTr}</td>
                  <td className="px-4 py-3 text-ink-soft">{transportLabel[t.transportType]}</td>
                  <td className="px-4 py-3 text-ink-soft">{t._count.tourDates} tarih</td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatMoney(t.basePriceMinor, "EUR")}</td>
                  <td className="px-4 py-3"><span className={`chip ${tourStatusColor[t.status]}`}>{tourStatusLabel[t.status]}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/turlar/${t.id}/duzenle`} className="text-sm font-semibold text-brand-700 hover:underline">Düzenle</Link>
                      <Link href={`/tur/${t.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:underline">
                        Görüntüle <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
