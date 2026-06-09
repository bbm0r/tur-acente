import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [destinations, tours] = await Promise.all([
    db.destination.findMany({ where: { isActive: true } }),
    db.tour.findMany({ where: { status: "PUBLISHED", deletedAt: null } }),
  ]);

  return [
    { url: BASE, priority: 1, changeFrequency: "daily" },
    { url: `${BASE}/turlar`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE}/hakkimizda`, priority: 0.3 },
    { url: `${BASE}/iletisim`, priority: 0.3 },
    ...destinations.map((d) => ({ url: `${BASE}/turlar/${d.slug}`, priority: 0.8, changeFrequency: "weekly" as const })),
    ...tours.map((t) => ({ url: `${BASE}/tur/${t.slug}`, lastModified: t.updatedAt, priority: 0.7, changeFrequency: "weekly" as const })),
  ];
}
