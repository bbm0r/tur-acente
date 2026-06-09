import type { Metadata } from "next";
import { StaticPage } from "@/components/public/StaticPage";

export const metadata: Metadata = { title: "Gizlilik ve KVKK" };

export default function Page() {
  return <StaticPage slug="gizlilik" />;
}
