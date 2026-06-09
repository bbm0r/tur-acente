"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";

export async function deleteMediaAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await getStaffUser();
  if (!u) return { ok: false, error: "Yetkisiz" };
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return { ok: false, error: "Bulunamadı" };
  await db.media.delete({ where: { id } });
  try {
    if (m.fileKey.startsWith("/uploads/")) await unlink(path.join(process.cwd(), "public", m.fileKey));
  } catch {
    /* file already gone — ignore */
  }
  revalidatePath("/admin/medya");
  return { ok: true };
}
