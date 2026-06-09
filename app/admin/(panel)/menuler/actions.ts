"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

async function ensureMenu(location: "HEADER" | "FOOTER") {
  let m = await db.menu.findUnique({ where: { location } });
  if (!m) m = await db.menu.create({ data: { name: location === "HEADER" ? "Ana Menü" : "Alt Menü", location } });
  return m;
}

function refresh() {
  revalidatePath("/admin/menuler");
  revalidatePath("/", "layout");
}

export async function addMenuItemAction(location: "HEADER" | "FOOTER", label: string, url: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  if (!label.trim() || !url.trim()) return { ok: false, error: "Etiket ve bağlantı gerekli." };
  const menu = await ensureMenu(location);
  const count = await db.menuItem.count({ where: { menuId: menu.id } });
  await db.menuItem.create({ data: { menuId: menu.id, label: label.trim(), url: url.trim(), type: "CUSTOM_URL", sortOrder: count } });
  refresh();
  return { ok: true };
}

export async function updateMenuItemAction(id: string, label: string, url: string): Promise<{ ok: true }> {
  await requireStaff();
  await db.menuItem.update({ where: { id }, data: { label: label.trim() || "Bağlantı", url: url.trim() || "#" } });
  refresh();
  return { ok: true };
}

export async function deleteMenuItemAction(id: string): Promise<{ ok: true }> {
  await requireStaff();
  await db.menuItem.delete({ where: { id } });
  refresh();
  return { ok: true };
}

export async function reorderMenuAction(_location: "HEADER" | "FOOTER", orderedIds: string[]): Promise<{ ok: true }> {
  await requireStaff();
  await Promise.all(orderedIds.map((id, i) => db.menuItem.update({ where: { id }, data: { sortOrder: i } })));
  refresh();
  return { ok: true };
}
