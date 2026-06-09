"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";

const LIFECYCLES = ["SUBSCRIBER", "LEAD", "OPPORTUNITY", "CUSTOMER", "REPEAT_CUSTOMER", "LOST"];

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function updateCustomerAction(
  id: string,
  data: { firstName: string; lastName: string; phone: string; city?: string; nationality?: string; notes?: string; lifecycleStage: string; ownerId?: string; marketingConsent?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  if (!LIFECYCLES.includes(data.lifecycleStage)) return { ok: false, error: "Geçersiz aşama." };
  await db.customer.update({
    where: { id },
    data: {
      firstName: data.firstName?.trim() || "—",
      lastName: data.lastName?.trim() || "",
      phone: data.phone?.trim() || "",
      city: data.city?.trim() || null,
      nationality: data.nationality?.trim() || null,
      notes: data.notes?.trim() || null,
      lifecycleStage: data.lifecycleStage as never,
      ownerId: data.ownerId || null,
      marketingConsent: !!data.marketingConsent,
    },
  });
  revalidatePath(`/admin/musteriler/${id}`);
  revalidatePath("/admin/musteriler");
  return { ok: true };
}

export async function addCustomerTagAction(customerId: string, tagName: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const name = tagName.trim();
  if (!name) return { ok: false, error: "Etiket girin." };
  let tag = await db.crmTag.findUnique({ where: { name } });
  if (!tag) tag = await db.crmTag.create({ data: { name } });
  await db.customerTag.upsert({
    where: { customerId_tagId: { customerId, tagId: tag.id } },
    create: { customerId, tagId: tag.id },
    update: {},
  });
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { ok: true };
}

export async function removeCustomerTagAction(customerId: string, tagId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  await db.customerTag.delete({ where: { customerId_tagId: { customerId, tagId } } }).catch(() => {});
  revalidatePath(`/admin/musteriler/${customerId}`);
  return { ok: true };
}
