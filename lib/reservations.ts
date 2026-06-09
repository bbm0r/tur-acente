import "server-only";
import { db } from "./db";
import { quote, type QuoteInput } from "./pricing";
import { eurToTryMinor } from "./money";
import { generateReference } from "./reference";

export type CreateReservationInput = QuoteInput & {
  tourId: string;
  lead: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate?: string;
    nationality?: string;
  };
  paymentMethod: "BANK_TRANSFER" | "CREDIT_CARD" | null; // null = "agency will contact me"
};

export type CreateReservationResult = { reference: string; reservationId: string };

/**
 * Creates a reservation race-safely: server re-quotes the price, then inside a
 * single transaction performs a conditional seat decrement (no oversell),
 * upserts the customer, and writes passengers + extras + a notification.
 */
export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  const q = await quote(input);
  const room = await db.roomType.findUnique({ where: { code: input.roomTypeCode } });
  if (!room) throw new Error("ROOM_NOT_FOUND");

  const seats = input.adults + input.children; // infants share a lap (no seat)
  const status = input.paymentMethod ? "WAITING_PAYMENT" : "NEW_REQUEST";

  const subtotalMinor = eurToTryMinor(q.subtotalEurMinor, q.rate);
  const extrasMinor = eurToTryMinor(q.extrasEurMinor, q.rate);
  const discountMinor = eurToTryMinor(q.discountEurMinor, q.rate);
  const totalMinor = q.totalTryMinor;

  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    try {
      return await db.$transaction(async (tx) => {
        // Conditional seat decrement — the lock against oversell.
        const updated = await tx.$executeRaw`
          UPDATE "tour_dates"
          SET "seatsSold" = "seatsSold" + ${seats}
          WHERE "id" = ${input.tourDateId}
            AND ("quota" - "seatsSold" - "seatsHeld") >= ${seats}`;
        if (updated === 0) throw new Error("SOLD_OUT");

        let customer = await tx.customer.findFirst({
          where: { email: input.lead.email },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              firstName: input.lead.firstName,
              lastName: input.lead.lastName,
              email: input.lead.email,
              phone: input.lead.phone,
              nationality: input.lead.nationality || null,
              source: "DIRECT_WEB",
              lifecycleStage: "CUSTOMER",
            },
          });
        }

        const reservation = await tx.reservation.create({
          data: {
            reference,
            customerId: customer.id,
            tourId: input.tourId,
            tourDateId: input.tourDateId,
            channel: "DIRECT_WEB",
            status,
            adults: input.adults,
            children: input.children,
            infants: input.infants,
            currency: "TRY",
            exchangeRate: q.rate,
            exchangeRateAt: new Date(),
            subtotalMinor,
            extrasMinor,
            discountMinor,
            totalMinor,
            paidMinor: 0,
            balanceMinor: totalMinor,
            paymentMethod: input.paymentMethod ?? null,
          },
        });

        // Passengers: lead with full details + placeholders matching the headcount.
        const passengers: any[] = [
          {
            reservationId: reservation.id,
            paxType: "ADULT",
            isLead: true,
            firstName: input.lead.firstName,
            lastName: input.lead.lastName,
            email: input.lead.email,
            phone: input.lead.phone,
            nationality: input.lead.nationality || null,
            birthDate: input.lead.birthDate ? new Date(input.lead.birthDate) : null,
            roomTypeId: room.id,
          },
        ];
        for (let i = 1; i < input.adults; i++)
          passengers.push({
            reservationId: reservation.id,
            paxType: "ADULT",
            firstName: `Yetişkin ${i + 1}`,
            lastName: input.lead.lastName,
            roomTypeId: room.id,
          });
        for (let i = 0; i < input.children; i++)
          passengers.push({
            reservationId: reservation.id,
            paxType: "CHILD_WITH_BED",
            firstName: `Çocuk ${i + 1}`,
            lastName: input.lead.lastName,
            roomTypeId: room.id,
          });
        for (let i = 0; i < input.infants; i++)
          passengers.push({
            reservationId: reservation.id,
            paxType: "INFANT",
            firstName: `Bebek ${i + 1}`,
            lastName: input.lead.lastName,
          });
        await tx.reservationPassenger.createMany({ data: passengers });

        if (input.extraIds.length) {
          const extras = await tx.optionalExtra.findMany({
            where: { id: { in: input.extraIds } },
          });
          const paxCount = input.adults + input.children;
          await tx.reservationExtra.createMany({
            data: extras.map((e) => ({
              reservationId: reservation.id,
              optionalExtraId: e.id,
              quantity: e.perPax ? paxCount : 1,
              unitPriceMinor: e.priceMinor,
              currency: "EUR",
            })),
          });
        }

        await tx.notification.create({
          data: {
            type: "RES_NEW",
            channel: "EMAIL",
            toEmail: input.lead.email,
            reservationId: reservation.id,
            status: "QUEUED",
            payload: { reference, total: totalMinor },
          },
        });

        return { reference, reservationId: reservation.id };
      });
    } catch (e: any) {
      // Retry only on reference collision; surface SOLD_OUT and others.
      if (typeof e?.message === "string" && e.message.includes("Unique") && attempt < 4)
        continue;
      throw e;
    }
  }
  throw new Error("REFERENCE_GENERATION_FAILED");
}

export async function getReservationByReference(reference: string, contact?: string) {
  const r = await db.reservation.findUnique({
    where: { reference },
    include: {
      tour: { include: { destination: true } },
      tourDate: true,
      customer: true,
      passengers: true,
      extras: { include: { optionalExtra: true } },
      payments: true,
    },
  });
  if (!r) return null;
  if (contact) {
    const c = contact.trim().toLowerCase();
    const ok =
      r.customer.email.toLowerCase() === c ||
      r.customer.phone.replace(/\s/g, "") === contact.replace(/\s/g, "");
    if (!ok) return null;
  }
  return r;
}
