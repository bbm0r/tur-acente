"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { createSegment, createCampaign, sendCampaign, type SegmentFilter } from "@/lib/crm";

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function createSegmentAction(input: { name: string; filter: SegmentFilter }): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await requireStaff();
  if (!input.name?.trim()) return { ok: false, error: "Segment adı girin." };
  await createSegment({ name: input.name.trim(), filter: input.filter ?? {} }, u.id);
  revalidatePath("/admin/pazarlama");
  return { ok: true };
}

export async function createCampaignAction(formData: FormData) {
  const u = await requireStaff();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) redirect("/admin/pazarlama?e=name");
  const c = await createCampaign({ name }, u.id);
  redirect(`/admin/pazarlama/${c.id}`);
}

export async function updateCampaignAction(
  id: string,
  data: { name: string; subject: string; body: string; segmentId?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const existing = await db.emailCampaign.findUnique({ where: { id }, select: { status: true } });
  if (!existing) return { ok: false, error: "Bulunamadı." };
  if (existing.status === "SENT") return { ok: false, error: "Gönderilmiş kampanya düzenlenemez." };
  await db.emailCampaign.update({
    where: { id },
    data: { name: data.name.trim() || "İsimsiz", subject: data.subject, body: data.body, segmentId: data.segmentId || null },
  });
  revalidatePath(`/admin/pazarlama/${id}`);
  revalidatePath("/admin/pazarlama");
  return { ok: true };
}

export async function sendCampaignAction(id: string): Promise<{ ok: true; sent: number; failed: number; total: number } | { ok: false; error: string }> {
  await requireStaff();
  try {
    const r = await sendCampaign(id);
    await db.auditLog.create({ data: { actorRealm: "STAFF", action: "campaign.send", entity: "email_campaign", entityId: id } });
    revalidatePath(`/admin/pazarlama/${id}`);
    revalidatePath("/admin/pazarlama");
    return { ok: true, ...r };
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const map: Record<string, string> = { EMPTY: "Konu ve içerik gerekli.", NO_SEGMENT: "Bir segment seçin.", ALREADY_SENT: "Zaten gönderilmiş.", NOT_FOUND: "Bulunamadı." };
    return { ok: false, error: map[m] || "Gönderilemedi." };
  }
}
