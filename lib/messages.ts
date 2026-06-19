import "server-only";
import { db } from "./db";
import { sendEmail, emailLayout } from "./email";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";

export type ThreadMessage = {
  id: string;
  direction: "IN" | "OUT";
  body: string;
  subject: string | null;
  isRead: boolean;
  createdAt: Date;
  senderName: string | null;
};

/** All messages on a reservation, oldest → newest (chat order). */
export async function listReservationMessages(reservationId: string): Promise<ThreadMessage[]> {
  const rows = await db.message.findMany({
    where: { reservationId },
    include: { sender: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((m) => ({
    id: m.id,
    direction: m.direction,
    body: m.body,
    subject: m.subject,
    isRead: m.isRead,
    createdAt: m.createdAt,
    senderName: m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : null,
  }));
}

/**
 * Customer → agency (direction IN). Verifies the reservation belongs to the
 * customer, records the message, and drops an in-app ADMIN_ALERT for staff
 * (routed to the assigned agent when there is one).
 */
export async function postCustomerMessage(opts: { reservationId: string; customerId: string; body: string }) {
  const body = opts.body.trim();
  if (!body) throw new Error("EMPTY");

  const reservation = await db.reservation.findFirst({
    where: { id: opts.reservationId, customerId: opts.customerId },
    include: { customer: true },
  });
  if (!reservation) throw new Error("NOT_FOUND");

  const message = await db.message.create({
    data: {
      reservationId: reservation.id,
      customerId: reservation.customerId,
      channel: "WEB",
      direction: "IN",
      body,
      isRead: false,
    },
  });

  await db.notification.create({
    data: {
      type: "ADMIN_ALERT",
      channel: "WEB",
      userId: reservation.assignedToId ?? undefined,
      reservationId: reservation.id,
      status: "QUEUED",
      payload: {
        kind: "CUSTOMER_MESSAGE",
        reference: reservation.reference,
        customer: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
        preview: body.slice(0, 160),
      },
    },
  });

  return message;
}

/**
 * Agency → customer (direction OUT). Records the reply, marks the customer's
 * inbound messages read (staff has now answered), and emails the customer a
 * notification with a deep link back to the thread.
 */
export async function postStaffReply(opts: { reservationId: string; senderUserId: string; body: string }) {
  const body = opts.body.trim();
  if (!body) throw new Error("EMPTY");

  const reservation = await db.reservation.findUnique({
    where: { id: opts.reservationId },
    include: { customer: true, tour: true },
  });
  if (!reservation) throw new Error("NOT_FOUND");

  const message = await db.message.create({
    data: {
      reservationId: reservation.id,
      customerId: reservation.customerId,
      senderUserId: opts.senderUserId,
      channel: "WEB",
      direction: "OUT",
      body,
      isRead: true,
    },
  });

  await db.message.updateMany({
    where: { reservationId: reservation.id, direction: "IN", isRead: false },
    data: { isRead: true },
  });

  const html = emailLayout(
    "Acentenizden yeni mesaj",
    `<p>Merhaba ${reservation.customer.firstName},</p>
     <p><b>${reservation.tour.titleTr}</b> rezervasyonunuz (<b>${reservation.reference}</b>) hakkında acentemizden bir mesaj var:</p>
     <blockquote style="border-left:3px solid #0d9488;margin:14px 0;padding:8px 16px;color:#334155;background:#f8fafc;border-radius:8px;white-space:pre-wrap">${escapeHtml(body)}</blockquote>
     <p style="margin-top:16px"><a href="${BASE}/hesabim/rezervasyon/${encodeURIComponent(reservation.reference)}" style="background:#0d9488;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;display:inline-block">Görüntüle ve yanıtla</a></p>`,
  );
  const result = await sendEmail({ to: reservation.customer.email, subject: `Mesajınız var · ${reservation.reference}`, html });

  await db.notification.create({
    data: {
      type: "ADMIN_ALERT",
      channel: "EMAIL",
      toEmail: reservation.customer.email,
      reservationId: reservation.id,
      status: result.ok ? "SENT" : "FAILED",
      sentAt: result.ok ? new Date() : null,
      error: result.ok ? null : result.error,
      payload: { kind: "STAFF_REPLY", reference: reservation.reference },
    },
  });

  return message;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
