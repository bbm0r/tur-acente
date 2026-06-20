import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";

// Demo/protective default: block ALL crawling so the demo is never indexed and
// presented to the public as a real, licensed travel agency. The operator must
// explicitly opt in (ALLOW_INDEXING=true) once they hold a real TÜRSAB licence
// and have replaced the placeholder/demo content. See LICENSE / SORUMLULUK-REDDI.md.
const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";

export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/rezervasyon/", "/hesabim"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
