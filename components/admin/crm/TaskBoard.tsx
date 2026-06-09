"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, Calendar, User, Target, Clock } from "lucide-react";
import { formatDateTr } from "@/lib/utils";
import { completeActivityAction, createTaskAction } from "@/app/admin/(panel)/crm/actions";

type Task = { id: string; type: string; subject: string; body: string | null; dueAt: string | null; customerId: string | null; customerName: string | null; opportunityTitle: string | null; assigneeName: string | null };
type Groups = { overdue: Task[]; today: Task[]; upcoming: Task[]; noDate: Task[] };
type Staff = { id: string; firstName: string; lastName: string };

const TYPE_LABEL: Record<string, string> = { CALL: "Arama", EMAIL: "E-posta", WHATSAPP: "WhatsApp", MEETING: "Görüşme", NOTE: "Not", TASK: "Görev", SMS: "SMS" };
const SECTIONS: [keyof Groups, string, string][] = [
  ["overdue", "Gecikmiş", "text-rose-700"],
  ["today", "Bugün", "text-amber-700"],
  ["upcoming", "Yaklaşan", "text-sky-700"],
  ["noDate", "Tarihsiz", "text-slate-500"],
];

export function TaskBoard({ groups, staff }: { groups: Groups; staff: Staff[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();
  const [creating, setCreating] = useState(false);

  function complete(id: string) {
    setBusyId(id);
    start(async () => { await completeActivityAction(id); setBusyId(null); router.refresh(); });
  }

  const total = groups.overdue.length + groups.today.length + groups.upcoming.length + groups.noDate.length;

  return (
    <div>
      <div className="mb-4">
        {creating
          ? <NewTask staff={staff} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); router.refresh(); }} />
          : <button onClick={() => setCreating(true)} className="btn-primary px-3 py-2 text-sm"><Plus className="h-4 w-4" /> Yeni Görev</button>}
      </div>
      {total === 0 && <div className="card p-10 text-center text-ink-muted">Bekleyen görev yok. 🎉</div>}
      <div className="space-y-6">
        {SECTIONS.map(([key, label, cls]) => groups[key].length > 0 && (
          <div key={key}>
            <h3 className={`mb-2 flex items-center gap-2 text-sm font-bold ${cls}`}><Clock className="h-4 w-4" /> {label} <span className="chip bg-slate-100 text-ink-muted">{groups[key].length}</span></h3>
            <div className="card divide-y divide-slate-100">
              {groups[key].map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="chip bg-slate-100 text-ink-muted">{TYPE_LABEL[t.type] ?? t.type}</span>
                      <span className="font-medium text-ink">{t.subject}</span>
                    </div>
                    {t.body && <p className="mt-0.5 text-xs text-ink-muted">{t.body}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                      {t.dueAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateTr(t.dueAt)}</span>}
                      {t.customerName && t.customerId && <a href={`/admin/musteriler/${t.customerId}`} className="flex items-center gap-1 text-brand-700 hover:underline"><User className="h-3 w-3" /> {t.customerName}</a>}
                      {t.opportunityTitle && <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {t.opportunityTitle}</span>}
                      {t.assigneeName && <span>· {t.assigneeName}</span>}
                    </div>
                  </div>
                  <button onClick={() => complete(t.id)} disabled={busyId === t.id} className="btn-ghost shrink-0 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50">{busyId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Tamamla</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTask({ staff, onClose, onCreated }: { staff: Staff[]; onClose: () => void; onCreated: () => void }) {
  const [subject, setSubject] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [body, setBody] = useState("");
  const [busy, start] = useTransition();
  const [err, setErr] = useState("");

  function submit() {
    setErr("");
    start(async () => {
      const r = await createTaskAction({ subject, body, dueAt: dueAt || undefined, assignedToId: assignedToId || undefined });
      if (r.ok) onCreated(); else setErr(r.error);
    });
  }

  return (
    <div className="card p-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_160px_180px]">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Görev konusu" className="input text-sm" />
        <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="input text-sm" />
        <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="input text-sm"><option value="">Bana ata</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select>
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Detay (ops.)" className="input mt-2 min-h-[50px] text-sm" />
      {err && <p className="mt-1 text-sm text-rose-600">{err}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={busy || !subject.trim()} className="btn-primary px-4 py-2 text-sm">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Oluştur</button>
        <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">İptal</button>
      </div>
    </div>
  );
}
