import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "Kullanım Koşulları" };

export default function Page() {
  return <StaticPage slug="kosullar" />;
}
