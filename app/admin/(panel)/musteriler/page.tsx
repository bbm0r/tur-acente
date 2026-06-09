import Link from "next/link";
import { Search, UserSquare2 } from "lucide-react";
import { listCustomers, listStaff } from "@/lib/crm";
import { lifecycleLabel } from "@/lib/labels";

export const metadata = { title: "Müşteriler" };

const LC_CLS: Record<string, string> = {
  LEAD: "bg-amber-100 text-amber-800", OPPORTUNITY: "bg-sky-100 text-sky-800",
  CUSTOMER: "bg-emerald-100 text-emerald-700", REPEAT_CUSTOMER: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700", SUBSCRIBER: "bg-slate-100 text-slate-600",
};

export default async function CustomersList({ searchParams }: { searchParams: Promise<{ q?: string; lifecycle?: string; owner?: string }> }) {
  const sp = await searchParams;
  const [customers, staff] = await Promise.all([
    listCustomers({ q: sp.q, lifecycle: sp.lifecycle, ownerId: sp.owner }),
    listStaff(),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Müşteriler</h1>
        <p className="text-sm text-ink-muted">Tüm kişiler — ara, filtrele, 360° profili aç</p>
      </header>

      <form method="get" className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        <label className="block min-w-[200px] flex-1"><span className="label">Ara</span><input name="q" defaultValue={sp.q ?? ""} placeholder="Ad, e-posta, telefon" className="input" /></label>
        <label className="block"><span className="label">Aşama</span>
          <select name="lifecycle" defaultValue={sp.lifecycle ?? ""} className="input"><option value="">Hepsi</option>{Object.entries(lifecycleLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="block"><span className="label">Temsilci</span>
          <select name="owner" defaultValue={sp.owner ?? ""} className="input"><option value="">Hepsi</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select>
        </label>
        <button className="btn-primary"><Search className="h-4 w-4" /> Filtrele</button>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="px-4 py-3">Kişi</th><th className="px-4 py-3">İletişim</th><th className="px-4 py-3">Aşama</th><th className="px-4 py-3">Temsilci</th><th className="px-4 py-3">Rezerv.</th><th className="px-4 py-3">Fırsat</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/musteriler/${c.id}`} className="flex items-center gap-2 font-medium text-brand-700 hover:underline"><UserSquare2 className="h-4 w-4" /> {c.firstName} {c.lastName}</Link>
                  {c.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{c.tags.map((t) => <span key={t.tagId} className="chip bg-indigo-100 text-indigo-700">{t.tag.name}</span>)}</div>}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{c.email}<br />{c.phone}</td>
                <td className="px-4 py-3"><span className={`chip ${LC_CLS[c.lifecycleStage] ?? "bg-slate-100 text-slate-600"}`}>{lifecycleLabel[c.lifecycleStage] ?? c.lifecycleStage}</span></td>
                <td className="px-4 py-3 text-ink-muted">{c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{c._count.reservations}</td>
                <td className="px-4 py-3 text-ink-muted">{c._count.opportunities}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Kişi bulunamadı.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
