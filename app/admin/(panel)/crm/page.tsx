import { Users2, Target, Inbox } from "lucide-react";
import { db } from "@/lib/db";
import { getPipelineBoard, listCustomersLite, listLeads, listStaff } from "@/lib/crm";
import { PipelineBoard } from "@/components/admin/crm/PipelineBoard";
import { LeadsInbox } from "@/components/admin/crm/LeadsInbox";

export default async function AdminCrm() {
  const [board, customers, destinations, leads, staff, contactCount, openOpps] = await Promise.all([
    getPipelineBoard(),
    listCustomersLite(),
    db.destination.findMany({ select: { slug: true, nameTr: true }, orderBy: { nameTr: "asc" } }),
    listLeads(),
    listStaff(),
    db.customer.count(),
    db.crmOpportunity.count({ where: { status: "OPEN" } }),
  ]);

  const stages = (board?.stages ?? []).map((st) => ({
    id: st.id, name: st.name, probability: st.probability, isWon: st.isWon, isLost: st.isLost,
    opportunities: st.opportunities.map((o) => ({
      id: o.id, title: o.title,
      customerName: `${o.customer.firstName} ${o.customer.lastName}`,
      destinationName: o.destination?.nameTr ?? null,
      ownerName: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : null,
      estValueMinor: o.estValueMinor, currency: o.currency, status: o.status,
    })),
  }));

  const newLeadCount = leads.filter((l) => l.status === "NEW").length;
  const leadsForInbox = leads.map((l) => ({
    id: l.id, name: l.name, email: l.email, phone: l.phone, message: l.message,
    status: l.status, createdAt: l.createdAt.toISOString(),
    assignedTo: l.assignedTo ? { id: l.assignedTo.id, firstName: l.assignedTo.firstName, lastName: l.assignedTo.lastName } : null,
    destinationName: l.destination?.nameTr ?? null, tourTitle: l.tour?.titleTr ?? null,
    formName: l.submissions[0]?.form?.name ?? null,
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">CRM</h1>
        <p className="text-sm text-ink-muted">Aday → fırsat → müşteri akışı, satış hattı ve gelen talepler</p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users2 className="h-5 w-5" />} label="Toplam Kişi" value={String(contactCount)} />
        <Stat icon={<Target className="h-5 w-5" />} label="Açık Fırsat" value={String(openOpps)} />
        <Stat icon={<Inbox className="h-5 w-5" />} label="Yeni Talep" value={String(newLeadCount)} />
      </div>

      <PipelineBoard stages={stages} customers={customers} destinations={destinations} />

      <h2 className="mb-3 mt-8 font-bold text-ink">Gelen Talepler (Leads)</h2>
      <LeadsInbox leads={leadsForInbox} staff={staff} />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">{icon}</span>
      <div>
        <div className="text-xs text-ink-muted">{label}</div>
        <div className="text-xl font-extrabold text-ink">{value}</div>
      </div>
    </div>
  );
}
