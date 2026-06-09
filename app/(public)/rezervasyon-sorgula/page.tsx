import type { Metadata } from "next";
import { Search, AlertCircle } from "lucide-react";
import { getReservationByReference } from "@/lib/reservations";
import { ReservationView } from "@/components/public/ReservationView";

export const metadata: Metadata = {
  title: "Rezervasyon Sorgula",
  description: "Referans numaranız ve e-posta/telefonunuz ile rezervasyonunuzu sorgulayın.",
};

export default async function LookupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; contact?: string }>;
}) {
  const sp = await searchParams;
  const ref = sp.ref?.trim();
  const contact = sp.contact?.trim();
  const reservation = ref && contact ? await getReservationByReference(ref.toUpperCase(), contact) : null;
  const notFound = !!(ref && contact && !reservation);

  return (
    <div className="bg-slate-50">
      <div className="container-page max-w-3xl py-12">
        <h1 className="text-3xl font-extrabold text-ink">Rezervasyon Sorgula</h1>
        <p className="mt-1.5 text-ink-muted">Referans numaranız ve rezervasyonda kullandığınız e-posta veya telefon ile sorgulayın.</p>

        <form action="/rezervasyon-sorgula" method="get" className="card mt-6 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="label">Referans No</span>
            <input name="ref" defaultValue={ref ?? ""} placeholder="TA-XXXXXX" className="input uppercase" required />
          </label>
          <label className="block">
            <span className="label">E-posta veya Telefon</span>
            <input name="contact" defaultValue={contact ?? ""} placeholder="ornek@email.com" className="input" required />
          </label>
          <button type="submit" className="btn-primary h-[46px]"><Search className="h-4 w-4" /> Sorgula</button>
        </form>

        {notFound && (
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4" /> Bu bilgilerle eşleşen bir rezervasyon bulunamadı. Referans ve iletişim bilginizi kontrol edin.
          </div>
        )}

        {reservation && (
          <div className="mt-8">
            <ReservationView reservation={reservation} />
          </div>
        )}
      </div>
    </div>
  );
}
