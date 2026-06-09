import Link from "next/link";
import { getStaffUser } from "@/lib/auth";
import { listTasks, listStaff } from "@/lib/crm";
import { TaskBoard } from "@/components/admin/crm/TaskBoard";

export const metadata = { title: "Görevler" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const sp = await searchParams;
  const me = await getStaffUser();
  const scope = sp.scope === "all" ? "all" : "me";

  const [tasks, staff] = await Promise.all([
    listTasks({ assignedToId: scope === "all" ? undefined : me?.id }),
    listStaff(),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const ser = (t: (typeof tasks)[number]) => ({
    id: t.id, type: t.type, subject: t.subject, body: t.body,
    dueAt: t.dueAt?.toISOString() ?? null,
    customerId: t.customer?.id ?? null,
    customerName: t.customer ? `${t.customer.firstName} ${t.customer.lastName}` : null,
    opportunityTitle: t.opportunity?.title ?? null,
    assigneeName: t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : null,
  });

  const groups: { overdue: ReturnType<typeof ser>[]; today: ReturnType<typeof ser>[]; upcoming: ReturnType<typeof ser>[]; noDate: ReturnType<typeof ser>[] } = { overdue: [], today: [], upcoming: [], noDate: [] };
  for (const t of tasks) {
    const s = ser(t);
    if (!t.dueAt) groups.noDate.push(s);
    else if (t.dueAt < todayStart) groups.overdue.push(s);
    else if (t.dueAt < todayEnd) groups.today.push(s);
    else groups.upcoming.push(s);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Görevler</h1>
          <p className="text-sm text-ink-muted">Bekleyen aktiviteler ve takipler</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <Link href="/admin/gorevler?scope=me" className={`rounded-md px-3 py-1.5 ${scope === "me" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}>Bana atananlar</Link>
          <Link href="/admin/gorevler?scope=all" className={`rounded-md px-3 py-1.5 ${scope === "all" ? "bg-white text-ink shadow-sm" : "text-ink-muted"}`}>Tümü</Link>
        </div>
      </header>
      <TaskBoard groups={groups} staff={staff} />
    </div>
  );
}
