import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Home, Search } from "lucide-react";
import { getReservationByReference } from "@/lib/reservations";
import { getCustomerUser, hasBookingGrant } from "@/lib/auth";
import { ReservationView } from "@/components/public/ReservationView";

export const metadata: Metadata = { title: "Rezervasyon Onayı", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const decodedRef = decodeURIComponent(ref);
  const reservation = await getReservationByReference(decodedRef);
  if (!reservation) notFound();

  // Authorize: only the just-booked visitor (signed grant cookie) or the account
  // owner may see the PII here. Anyone else must verify via the email/phone lookup —
  // a guessed reference number alone is not enough.
  const me = await getCustomerUser();
  const authorized =
    (!!me?.customerId && reservation.customerId === me.customerId) || (await hasBookingGrant(decodedRef));
  if (!authorized) redirect(`/rezervasyon-sorgula?ref=${encodeURIComponent(decodedRef)}`);

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
          <p className="mt-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠️ <strong>DEMO / ÖRNEK:</strong> Bu bir demo sistemdir; oluşturulan kayıt{" "}
            <strong>gerçek bir rezervasyon, sözleşme veya tahsilat teşkil etmez</strong> ve bağlayıcı değildir.
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
