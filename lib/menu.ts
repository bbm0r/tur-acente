import "server-only";
import { db } from "./db";

export type NavItem = { label: string; url: string; newTab?: boolean };

export async function getMenuItems(location: "HEADER" | "FOOTER"): Promise<NavItem[]> {
  const menu = await db.menu.findUnique({
    where: { location },
    include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
  });
  return (menu?.items ?? []).map((i) => ({ label: i.label, url: i.url ?? "#", newTab: i.newTab }));
}
