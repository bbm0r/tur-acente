import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "İptal ve İade Koşulları" };

export default function Page() {
  return <StaticPage slug="iptal-iade" />;
}
