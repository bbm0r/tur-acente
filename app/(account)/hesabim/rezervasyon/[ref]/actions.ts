"use server";

import { revalidatePath } from "next/cache";
import { getCustomerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { postCustomerMessage } from "@/lib/messages";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function sendCustomerMessageAction(reference: string, body: string): Promise<ActionResult> {
  const user = await getCustomerUser();
  if (!user?.customerId) return { ok: false, error: "Oturum gerekli." };
  if (!body.trim()) return { ok: false, error: "Mesaj boş olamaz." };

  const reservation = await db.reservation.findFirst({
    where: { reference, customerId: user.customerId },
    select: { id: true },
  });
  if (!reservation) return { ok: false, error: "Rezervasyon bulunamadı." };

  try {
    await postCustomerMessage({ reservationId: reservation.id, customerId: user.customerId, body });
    revalidatePath(`/hesabim/rezervasyon/${reference}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Mesaj gönderilemedi." };
  }
}
