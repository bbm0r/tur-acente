import { db } from "@/lib/db";
import { MenuBuilder } from "@/components/admin/cms/MenuBuilder";

export const metadata = { title: "Menüler" };

export default async function MenusPage() {
  const [header, footer, destinations, pages] = await Promise.all([
    db.menu.findUnique({ where: { location: "HEADER" }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    db.menu.findUnique({ where: { location: "FOOTER" }, include: { items: { orderBy: { sortOrder: "asc" } } } }),
    db.destination.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.page.findMany({ where: { status: "PUBLISHED" }, orderBy: { titleTr: "asc" } }),
  ]);

  const toItems = (m: { items: { id: string; label: string; url: string | null }[] } | null) =>
    (m?.items ?? []).map((i) => ({ id: i.id, label: i.label, url: i.url ?? "" }));

  const quick = [
    { label: "Ana Sayfa", url: "/" },
    { label: "Tüm Turlar", url: "/turlar" },
    { label: "Kampanyalar", url: "/turlar?kampanya=1" },
    { label: "Rezervasyon Sorgula", url: "/rezervasyon-sorgula" },
    { label: "İletişim", url: "/iletisim" },
    ...destinations.map((d) => ({ label: d.nameTr, url: `/turlar/${d.slug}` })),
    ...pages.map((p) => ({ label: p.titleTr, url: `/${p.slug}` })),
  ];

  return <MenuBuilder header={toItems(header)} footer={toItems(footer)} quick={quick} />;
}
