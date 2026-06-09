import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCustomerUser } from "@/lib/auth";
import { getMyReservationByRef } from "@/lib/account";
import { ReservationView } from "@/components/public/ReservationView";

export default async function MyReservationDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const user = await getCustomerUser();
  const reservation = user?.customerId ? await getMyReservationByRef(user.customerId, decodeURIComponent(ref)) : null;
  if (!reservation) notFound();

  return (
    <div>
      <Link href="/hesabim" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Rezervasyonlarım
      </Link>
      <ReservationView reservation={reservation} />
    </div>
  );
}
