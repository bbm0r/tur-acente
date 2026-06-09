import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/rezervasyon/", "/hesabim"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
