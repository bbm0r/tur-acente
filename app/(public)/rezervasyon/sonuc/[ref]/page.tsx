import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Home, Search } from "lucide-react";
import { getReservationByReference } from "@/lib/reservations";
import { ReservationView } from "@/components/public/ReservationView";

export const metadata: Metadata = { title: "Rezervasyon Onayı", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const reservation = await getReservationByReference(decodeURIComponent(ref));
  if (!reservation) notFound();

  return (
    <div className="bg-slate-50">
      <div className="container-page py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-9 w-9" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-ink">Rezervasyon talebiniz alındı!</h1>
          <p className="mt-2 max-w-xl text-ink-muted">
            Referans numaranız <strong className="text-ink">{reservation.reference}</strong>. Bu numarayı
            saklayın — rezervasyonunuzu istediğiniz zaman sorgulayabilirsiniz. Onay e-postası gönderildi.
          </p>
        </div>

        <ReservationView reservation={reservation} />

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost"><Home className="h-4 w-4" /> Ana Sayfa</Link>
          <Link href="/rezervasyon-sorgula" className="btn-primary"><Search className="h-4 w-4" /> Rezervasyon Sorgula</Link>
        </div>
      </div>
    </div>
  );
}
