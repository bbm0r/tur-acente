import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getCustomerUser } from "@/lib/auth";
import { getMyReservationByRef } from "@/lib/account";
import { listReservationMessages } from "@/lib/messages";
import { ReservationView } from "@/components/public/ReservationView";
import { MessagePanel } from "@/components/messaging/MessagePanel";
import { formatDateTimeTr } from "@/lib/utils";
import { sendCustomerMessageAction } from "./actions";

export default async function MyReservationDetail({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const user = await getCustomerUser();
  const reservation = user?.customerId ? await getMyReservationByRef(user.customerId, decodeURIComponent(ref)) : null;
  if (!reservation) notFound();

  const messages = (await listReservationMessages(reservation.id)).map((m) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    createdAtLabel: formatDateTimeTr(m.createdAt),
    senderName: m.senderName,
  }));

  return (
    <div>
      <Link href="/hesabim" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Rezervasyonlarım
      </Link>
      <ReservationView reservation={reservation} />

      <section className="card mt-6 p-6">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-ink">
          <MessageCircle className="h-5 w-5 text-brand-600" /> Acente ile Mesajlaşma
        </h2>
        <p className="mb-4 text-sm text-ink-muted">
          Rezervasyonunuzla ilgili sorularınızı buradan acentemize iletebilirsiniz. Yanıt geldiğinde e-posta ile bilgilendirilirsiniz.
        </p>
        <MessagePanel
          perspective="customer"
          messages={messages}
          action={sendCustomerMessageAction}
          boundArg={reservation.reference}
        />
      </section>
    </div>
  );
}
