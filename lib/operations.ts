import "server-only";
import { db } from "./db";

export async function getDepartureOps(tourDateId: string) {
  const td = await db.tourDate.findUnique({
    where: { id: tourDateId },
    include: {
      tour: { include: { destination: true } },
      reservations: {
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        include: { customer: true, passengers: { include: { roomType: true } } },
        orderBy: { reference: "asc" },
      },
    },
  });
  if (!td) return null;

  const pax = td.reservations.flatMap((r) =>
    r.passengers.map((p) => ({
      ref: r.reference,
      customer: `${r.customer.firstName} ${r.customer.lastName}`,
      name: `${p.firstName} ${p.lastName}`,
      paxType: p.paxType,
      room: p.roomType?.code ?? "",
      nationality: p.nationality ?? "",
      isLead: p.isLead,
    })),
  );

  const payment = td.reservations.map((r) => ({
    ref: r.reference,
    customer: `${r.customer.firstName} ${r.customer.lastName}`,
    total: r.totalMinor,
    paid: r.paidMinor,
    balance: r.balanceMinor,
    status: r.status,
  }));

  return { td, reservations: td.reservations, pax, payment };
}
