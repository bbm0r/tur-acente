import Link from "next/link";
import { Plus, ExternalLink, Pencil, FileText } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTr } from "@/lib/utils";
import { DeletePageButton } from "@/components/admin/cms/DeletePageButton";

export default async function PagesList() {
  const pages = await db.page.findMany({ orderBy: [{ isSystem: "asc" }, { updatedAt: "desc" }] });

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Sayfalar</h1>
          <p className="text-sm text-ink-muted">Bloklarla sayfa oluşturun ve yayınlayın</p>
        </div>
        <Link href="/admin/sayfalar/yeni" className="btn-primary"><Plus className="h-4 w-4" /> Yeni Sayfa</Link>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="px-4 py-3">Başlık</th><th className="px-4 py-3">URL</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Güncelleme</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><span className="flex items-center gap-2 font-medium text-ink"><FileText className="h-4 w-4 text-brand-500" /> {p.titleTr} {p.isSystem && <span className="chip bg-violet-100 text-violet-700">Yasal</span>}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">/{p.slug}</td>
                <td className="px-4 py-3"><span className={`chip ${p.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{p.status === "PUBLISHED" ? "Yayında" : "Taslak"}</span></td>
                <td className="px-4 py-3 text-ink-muted">{formatDateTr(p.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/sayfalar/${p.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><Pencil className="h-3.5 w-3.5" /> Düzenle</Link>
                    {p.status === "PUBLISHED" && <Link href={`/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:underline">Görüntüle <ExternalLink className="h-3.5 w-3.5" /></Link>}
                    {!p.isSystem && <DeletePageButton id={p.id} title={p.titleTr} />}
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-muted">Henüz sayfa yok. “Yeni Sayfa” ile başlayın.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
