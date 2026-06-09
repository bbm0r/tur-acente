import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { TourForm } from "@/components/admin/tour/TourForm";

export default async function NewTourPage() {
  const destinations = await db.destination.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/turlar" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Turlar
      </Link>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Yeni Tur</h1>
      <p className="mb-6 text-sm text-ink-muted">Önce genel bilgileri kaydedin, ardından kalkış tarihlerini ekleyin.</p>
      <TourForm destinations={destinations.map((d) => ({ id: d.id, name: d.nameTr }))} mode="create" />
    </div>
  );
}
