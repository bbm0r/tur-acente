import Link from "next/link";
import { Plus, Pencil, Inbox, AlertCircle, FormInput } from "lucide-react";
import { db } from "@/lib/db";
import { createFormAction } from "./actions";

export const metadata = { title: "Formlar" };

export default async function FormsList({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const forms = await db.form.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Formlar</h1>
        <p className="text-sm text-ink-muted">İletişim/başvuru formları oluşturun; gönderiler CRM’e düşer</p>
      </header>

      <form action={createFormAction} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <label className="block flex-1 min-w-[220px]">
          <span className="label">Yeni form adı</span>
          <input name="name" required minLength={2} placeholder="Örn. İletişim Formu" className="input" />
        </label>
        <button className="btn-primary"><Plus className="h-4 w-4" /> Oluştur</button>
        {e === "name" && <span className="flex items-center gap-1 text-sm text-rose-600"><AlertCircle className="h-4 w-4" /> Geçerli bir ad girin.</span>}
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="px-4 py-3">Form</th><th className="px-4 py-3">Anahtar</th><th className="px-4 py-3">Alanlar</th><th className="px-4 py-3">Gönderiler</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {forms.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><span className="flex items-center gap-2 font-medium text-ink"><FormInput className="h-4 w-4 text-brand-500" /> {f.name}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{f.key}</td>
                <td className="px-4 py-3 text-ink-muted">{Array.isArray(f.fields) ? f.fields.length : 0}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/formlar/${f.id}/gonderiler`} className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                    <Inbox className="h-3.5 w-3.5" /> {f._count.submissions}
                  </Link>
                </td>
                <td className="px-4 py-3"><span className={`chip ${f.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{f.isActive ? "Aktif" : "Pasif"}</span></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/formlar/${f.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><Pencil className="h-3.5 w-3.5" /> Düzenle</Link>
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-muted">Henüz form yok. Yukarıdan bir form oluşturun.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
