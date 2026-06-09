import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getDestinationBySlug, listTours } from "@/lib/catalog";
import { getCustomerUser } from "@/lib/auth";
import { getFavoriteTourIds } from "@/lib/account";
import { destinationTheme } from "@/lib/theme";
import { TourCard } from "@/components/public/TourCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDestinationBySlug(slug);
  if (!d) return { title: "Destinasyon bulunamadı" };
  return {
    title: d.seoTitle ?? `${d.nameTr}`,
    description: d.seoDescription ?? d.summaryTr ?? undefined,
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dest = await getDestinationBySlug(slug);
  if (!dest) notFound();
  const tours = await listTours({ destinationSlug: slug });
  const theme = destinationTheme(dest.slug);
  const me = await getCustomerUser();
  const favIds = me?.customerId ? await getFavoriteTourIds(me.customerId) : new Set<string>();

  return (
    <div className="bg-slate-50">
      <section className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} text-white`}>
        <div className="absolute -right-6 -top-6 text-[12rem] opacity-20">{theme.emoji}</div>
        <div className="container-page relative py-14">
          <nav className="flex items-center gap-1 text-sm text-white/80">
            <Link href="/" className="hover:underline">Ana Sayfa</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/turlar" className="hover:underline">Turlar</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-white">{dest.nameTr}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-extrabold drop-shadow-sm">{dest.nameTr}</h1>
          <p className="mt-2 max-w-2xl text-lg text-white/90">{dest.summaryTr}</p>
          <div className="mt-4 chip bg-white/20 text-white ring-1 ring-white/25">{tours.length} tur</div>
        </div>
      </section>

      {dest.descriptionTr && (
        <div className="container-page pt-8">
          <p className="max-w-3xl text-ink-soft">{dest.descriptionTr}</p>
        </div>
      )}

      <div className="container-page py-10">
        {tours.length === 0 ? (
          <div className="card p-12 text-center text-ink-muted">Bu destinasyon için yakında turlar eklenecek.</div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((t) => (
              <TourCard key={t.id} tour={t as any} favorited={favIds.has(t.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
