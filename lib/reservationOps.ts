import "server-only";
import { db } from "./db";
import { canTransition } from "./statusMachine";

/** Validate + apply a reservation status change, releasing seats on cancel. Audited. */
export async function changeStatus(reservationId: string, to: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const res = await tx.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    if (!canTransition(res.status, to)) throw new Error("INVALID_TRANSITION");

    const data: any = { status: to };
    if (to === "CANCELLED") {
      data.cancelledAt = new Date();
      const seats = res.adults + res.children;
      await tx.$executeRaw`UPDATE "tour_dates" SET "seatsSold" = GREATEST(0, "seatsSold" - ${seats}) WHERE id = ${res.tourDateId}`;
    }
    if (to === "COMPLETED") data.completedAt = new Date();

    const updated = await tx.reservation.update({ where: { id: reservationId }, data });
    await tx.auditLog.create({
      data: {
        actorUserId, actorRealm: "STAFF", action: `reservation.status.${to}`,
        entity: "reservation", entityId: reservationId,
        before: { status: res.status }, after: { status: to },
      },
    });
    return updated;
  });
}

/** Record a manual payment, recompute the ledger, and auto-advance to PAYMENT_RECEIVED when cleared. */
export async function recordPayment(opts: {
  reservationId: string;
  method: "CREDIT_CARD" | "BANK_TRANSFER" | "CASH" | "AGENCY_CREDIT";
  amountMinor: number;
  recordedById: string;
  note?: string;
}) {
  return db.$transaction(async (tx) => {
    const res = await tx.reservation.findUniqueOrThrow({ where: { id: opts.reservationId } });
    const payment = await tx.payment.create({
      data: {
        reservationId: opts.reservationId, method: opts.method, status: "SUCCEEDED",
        amountMinor: opts.amountMinor, currency: "TRY", provider: "manual",
        paidAt: new Date(), recordedById: opts.recordedById, note: opts.note,
      },
    });

    const paidAgg = await tx.payment.aggregate({ where: { reservationId: opts.reservationId, status: "SUCCEEDED" }, _sum: { amountMinor: true } });
    const refundAgg = await tx.refund.aggregate({ where: { reservationId: opts.reservationId, status: "PROCESSED" }, _sum: { amountMinor: true } });
    const paid = (paidAgg._sum.amountMinor ?? 0) - (refundAgg._sum.amountMinor ?? 0);
    const balance = res.totalMinor - paid;

    const data: any = { paidMinor: paid, balanceMinor: balance };
    if (balance <= 0 && (res.status === "WAITING_PAYMENT" || res.status === "NEW_REQUEST")) {
      data.status = "PAYMENT_RECEIVED";
    }
    await tx.reservation.update({ where: { id: opts.reservationId }, data });
    await tx.auditLog.create({
      data: {
        actorUserId: opts.recordedById, actorRealm: "STAFF", action: "payment.record",
        entity: "reservation", entityId: opts.reservationId,
        after: { amountMinor: opts.amountMinor, method: opts.method },
      },
    });
    return payment;
  });
}

export async function addInternalNote(reservationId: string, note: string, actorUserId: string) {
  const res = await db.reservation.findUniqueOrThrow({ where: { id: reservationId } });
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const appended = `${res.notesInternal ? res.notesInternal + "\n" : ""}[${stamp}] ${note}`;
  await db.reservation.update({ where: { id: reservationId }, data: { notesInternal: appended } });
  await db.auditLog.create({ data: { actorUserId, actorRealm: "STAFF", action: "reservation.note", entity: "reservation", entityId: reservationId } });
}

export async function assignAgent(reservationId: string, assignedToId: string | null, actorUserId: string) {
  await db.reservation.update({ where: { id: reservationId }, data: { assignedToId } });
  await db.auditLog.create({ data: { actorUserId, actorRealm: "STAFF", action: "reservation.assign", entity: "reservation", entityId: reservationId, after: { assignedToId } } });
}
