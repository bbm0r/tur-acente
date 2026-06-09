"use server";

import { revalidatePath } from "next/cache";
import { getStaffUser } from "@/lib/auth";
import { changeStatus, recordPayment, addInternalNote, assignAgent } from "@/lib/reservationOps";
import { sendPaymentReceived } from "@/lib/notify";

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateStatusAction(reservationId: string, to: string): Promise<ActionResult> {
  const u = await requireStaff();
  try {
    await changeStatus(reservationId, to, u.id);
    revalidatePath(`/admin/rezervasyonlar/${reservationId}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message === "INVALID_TRANSITION" ? "Bu duruma geçiş yapılamaz." : "İşlem başarısız." };
  }
}

export async function recordPaymentAction(reservationId: string, method: string, amountMinor: number, note?: string): Promise<ActionResult> {
  const u = await requireStaff();
  if (!["CREDIT_CARD", "BANK_TRANSFER", "CASH", "AGENCY_CREDIT"].includes(method)) return { ok: false, error: "Geçersiz ödeme yöntemi." };
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) return { ok: false, error: "Geçerli bir tutar girin." };
  await recordPayment({ reservationId, method: method as any, amountMinor, recordedById: u.id, note });
  try { await sendPaymentReceived(reservationId); } catch {}
  revalidatePath(`/admin/rezervasyonlar/${reservationId}`);
  return { ok: true };
}

export async function addNoteAction(reservationId: string, note: string): Promise<ActionResult> {
  const u = await requireStaff();
  if (!note.trim()) return { ok: false, error: "Not boş olamaz." };
  await addInternalNote(reservationId, note.trim(), u.id);
  revalidatePath(`/admin/rezervasyonlar/${reservationId}`);
  return { ok: true };
}

export async function assignAgentAction(reservationId: string, assignedToId: string): Promise<ActionResult> {
  const u = await requireStaff();
  await assignAgent(reservationId, assignedToId || null, u.id);
  revalidatePath(`/admin/rezervasyonlar/${reservationId}`);
  return { ok: true };
}
