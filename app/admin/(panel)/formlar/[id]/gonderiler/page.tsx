import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/utils";
import type { FormField } from "@/lib/blocks";
import { setSubmissionStatusAction } from "../../actions";

export const metadata = { title: "Form Gönderileri" };

const STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Yeni", cls: "bg-amber-100 text-amber-700" },
  READ: { label: "Okundu", cls: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "Arşiv", cls: "bg-slate-100 text-slate-600" },
  SPAM: { label: "Spam", cls: "bg-rose-100 text-rose-700" },
};

export default async function SubmissionsInbox({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({ where: { id } });
  if (!form) notFound();
  const fields = (Array.isArray(form.fields) ? form.fields : []) as FormField[];
  const submissions = await db.formSubmission.findMany({ where: { formId: id }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <header className="mb-6 flex items-center gap-3">
        <Link href={`/admin/formlar/${id}`} className="text-ink-muted hover:text-ink"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{form.name} · Gönderiler</h1>
          <p className="text-sm text-ink-muted">{submissions.length} gönderi</p>
        </div>
      </header>

      <div className="space-y-3">
        {submissions.map((s) => {
          const data = (s.data ?? {}) as Record<string, string>;
          const st = STATUS[s.status] ?? STATUS.NEW;
          return (
            <div key={s.id} className="card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`chip ${st.cls}`}>{st.label}</span>
                  <span className="text-xs text-ink-muted">{formatDateTimeTr(s.createdAt)}</span>
                  {s.leadId && <Link href="/admin/crm" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">CRM’de aç <ExternalLink className="h-3 w-3" /></Link>}
                </div>
                <div className="flex items-center gap-1.5">
                  {(["READ", "ARCHIVED", "SPAM"] as const).map((status) => (
                    <form key={status} action={setSubmissionStatusAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="formId" value={id} />
                      <input type="hidden" name="status" value={status} />
                      <button className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-slate-100" disabled={s.status === status}>{STATUS[status].label}</button>
                    </form>
                  ))}
                </div>
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key} className="flex gap-2">
                    <dt className="shrink-0 font-medium text-ink-muted">{f.label}:</dt>
                    <dd className="min-w-0 break-words text-ink">{data[f.key] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        {submissions.length === 0 && (
          <div className="card p-12 text-center text-ink-muted">Henüz gönderi yok.</div>
        )}
      </div>
    </div>
  );
}
