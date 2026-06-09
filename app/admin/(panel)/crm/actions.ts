"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { convertLeadToOpportunity, moveOpportunity, createOpportunity, logActivity, getOpportunity, createTask } from "@/lib/crm";

const LEAD_STATUSES = ["NEW", "CONTACTED", "CONVERTED", "LOST"] as const;
type LeadStatus = (typeof LEAD_STATUSES)[number];

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function setLeadStatusAction(leadId: string, status: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  if (!LEAD_STATUSES.includes(status as LeadStatus)) return { ok: false, error: "Geçersiz durum." };
  await db.lead.update({ where: { id: leadId }, data: { status: status as LeadStatus } });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function assignLeadAction(leadId: string, userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  await db.lead.update({ where: { id: leadId }, data: { assignedToId: userId || null } });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function convertLeadAction(leadId: string): Promise<{ ok: true; opportunityId: string; customerId: string } | { ok: false; error: string }> {
  const u = await requireStaff();
  try {
    const r = await convertLeadToOpportunity(leadId, u.id);
    await db.auditLog.create({ data: { actorUserId: u.id, actorRealm: "STAFF", action: "lead.convert", entity: "lead", entityId: leadId } });
    revalidatePath("/admin/crm");
    return { ok: true, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: msg === "NO_PIPELINE" ? "Önce bir satış hattı (pipeline) gerekli." : "Dönüştürülemedi." };
  }
}

const ACTIVITY_TYPES = ["CALL", "EMAIL", "WHATSAPP", "MEETING", "NOTE", "TASK", "SMS"];
const OPP_STATUSES = ["OPEN", "WON", "LOST"];

export async function moveOpportunityAction(oppId: string, stageId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  try { await moveOpportunity(oppId, stageId); revalidatePath("/admin/crm"); return { ok: true }; }
  catch { return { ok: false, error: "Taşınamadı." }; }
}

export async function createOpportunityAction(
  input: { title: string; customerId: string; estValueEur?: number; expectedTravelDate?: string; destinationSlug?: string; adults?: number; children?: number },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const u = await requireStaff();
  if (!input.title?.trim()) return { ok: false, error: "Başlık girin." };
  if (!input.customerId) return { ok: false, error: "Müşteri seçin." };
  try {
    const opp = await createOpportunity({
      title: input.title.trim(),
      customerId: input.customerId,
      estValueMinor: input.estValueEur != null && !Number.isNaN(input.estValueEur) ? Math.round(input.estValueEur * 100) : undefined,
      expectedTravelDate: input.expectedTravelDate ? new Date(input.expectedTravelDate) : undefined,
      destinationSlug: input.destinationSlug || undefined,
      adults: input.adults, children: input.children,
    }, u.id);
    revalidatePath("/admin/crm");
    return { ok: true, id: opp.id };
  } catch (e) {
    return { ok: false, error: (e instanceof Error && e.message === "NO_PIPELINE") ? "Satış hattı yok." : "Oluşturulamadı." };
  }
}

export async function logActivityAction(
  input: { opportunityId?: string; customerId?: string; type: string; subject: string; body?: string; dueAt?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await requireStaff();
  if (!ACTIVITY_TYPES.includes(input.type)) return { ok: false, error: "Geçersiz tür." };
  if (!input.subject?.trim()) return { ok: false, error: "Konu girin." };
  await logActivity({ type: input.type, subject: input.subject.trim(), body: input.body?.trim() || undefined, opportunityId: input.opportunityId, customerId: input.customerId, dueAt: input.dueAt ? new Date(input.dueAt) : undefined }, u.id);
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function setOpportunityStatusAction(oppId: string, status: string, lostReason?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  if (!OPP_STATUSES.includes(status)) return { ok: false, error: "Geçersiz durum." };
  await db.crmOpportunity.update({
    where: { id: oppId },
    data: { status: status as never, closedAt: status === "OPEN" ? null : new Date(), lostReason: status === "LOST" ? (lostReason || null) : null },
  });
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function completeActivityAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  await db.crmActivity.update({ where: { id }, data: { status: "DONE", completedAt: new Date() } });
  revalidatePath("/admin/gorevler");
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function createTaskAction(
  input: { subject: string; body?: string; dueAt?: string; assignedToId?: string; customerId?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await requireStaff();
  if (!input.subject?.trim()) return { ok: false, error: "Konu girin." };
  await createTask({
    subject: input.subject.trim(),
    body: input.body?.trim() || undefined,
    dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    assignedToId: input.assignedToId || undefined,
    customerId: input.customerId || undefined,
  }, u.id);
  revalidatePath("/admin/gorevler");
  return { ok: true };
}

export async function getOpportunityAction(oppId: string): Promise<{ ok: true; opp: Record<string, unknown> } | { ok: false; error: string }> {
  await requireStaff();
  const o = await getOpportunity(oppId);
  if (!o) return { ok: false, error: "Bulunamadı." };
  return {
    ok: true,
    opp: {
      id: o.id, title: o.title, status: o.status, estValueMinor: o.estValueMinor, currency: o.currency,
      expectedTravelDate: o.expectedTravelDate?.toISOString() ?? null, adults: o.adults, children: o.children,
      stageName: o.stage?.name ?? null, lostReason: o.lostReason, reservationId: o.reservationId,
      customer: o.customer, owner: o.owner ? `${o.owner.firstName} ${o.owner.lastName}` : null,
      destinationName: o.destination?.nameTr ?? null, tourTitle: o.tour?.titleTr ?? null,
      activities: o.activities.map((a) => ({
        id: a.id, type: a.type, status: a.status, subject: a.subject, body: a.body,
        dueAt: a.dueAt?.toISOString() ?? null, createdAt: a.createdAt.toISOString(),
        createdBy: a.createdBy ? `${a.createdBy.firstName} ${a.createdBy.lastName}` : null,
      })),
    },
  };
}
