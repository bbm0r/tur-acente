"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCustomerUser, logout } from "@/lib/auth";
import { toggleFavorite, updateCustomerProfile } from "@/lib/account";

export async function toggleFavoriteAction(tourId: string): Promise<{ ok: true; favorited: boolean } | { ok: false; needsLogin: boolean }> {
  const u = await getCustomerUser();
  if (!u || !u.customerId) return { ok: false, needsLogin: true };
  const favorited = await toggleFavorite(u.customerId, tourId);
  revalidatePath("/hesabim/favoriler");
  return { ok: true, favorited };
}

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(7),
  marketingConsent: z.boolean(),
});

export async function updateProfileAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await getCustomerUser();
  if (!u || !u.customerId) return { ok: false, error: "Oturum bulunamadı." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Lütfen alanları kontrol edin." };
  await updateCustomerProfile(u.customerId, parsed.data);
  revalidatePath("/hesabim/profil");
  return { ok: true };
}

export async function customerLogoutAction() {
  await logout();
  redirect("/");
}
