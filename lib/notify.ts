import "server-only";
import { db } from "./db";
import { sendEmail, emailLayout } from "./email";
import { formatMoney } from "./money";
import { formatDateRangeTr } from "./utils";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";

/** Customer confirmation email when a reservation is created. */
export async function sendReservationConfirmation(reference: string) {
  const r = await db.reservation.findUnique({
    where: { reference },
    include: { customer: true, tour: { include: { destination: true } }, tourDate: true },
  });
  if (!r) return;

  const html = emailLayout(
    "Rezervasyon talebiniz alındı 🎉",
    `<p>Merhaba ${r.customer.firstName},</p>
     <p><b>${r.tour.titleTr}</b> turu için rezervasyon talebiniz başarıyla alındı.</p>
     <table style="font-size:14px;line-height:1.9">
       <tr><td style="color:#64748b">Referans No</td><td><b>${r.reference}</b></td></tr>
       <tr><td style="color:#64748b">Destinasyon</td><td>${r.tour.destination.nameTr}</td></tr>
       <tr><td style="color:#64748b">Tarih</td><td>${formatDateRangeTr(r.tourDate.startDate, r.tourDate.endDate)}</td></tr>
       <tr><td style="color:#64748b">Kişi</td><td>${r.adults} yetişkin${r.children ? `, ${r.children} çocuk` : ""}</td></tr>
       <tr><td style="color:#64748b">Toplam</td><td><b>${formatMoney(r.totalMinor)}</b></td></tr>
     </table>
     <p style="margin-top:16px"><a href="${BASE}/rezervasyon-sorgula" style="background:#0d9488;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;display:inline-block">Rezervasyonu Görüntüle</a></p>`,
  );

  const result = await sendEmail({ to: r.customer.email, subject: `Rezervasyon Alındı · ${r.reference}`, html });

  // mark the queued outbox row sent/failed (created in createReservation)
  const updated = await db.notification.updateMany({
    where: { reservationId: r.id, type: "RES_NEW", status: "QUEUED" },
    data: { status: result.ok ? "SENT" : "FAILED", sentAt: result.ok ? new Date() : null, error: result.ok ? null : result.error },
  });
  if (updated.count === 0) {
    await db.notification.create({
      data: { type: "RES_NEW", channel: "EMAIL", toEmail: r.customer.email, reservationId: r.id, status: result.ok ? "SENT" : "FAILED", sentAt: result.ok ? new Date() : null, error: result.ok ? null : result.error, payload: { reference: r.reference } },
    });
  }
}

/** Customer email when a payment is recorded. */
export async function sendPaymentReceived(reservationId: string) {
  const r = await db.reservation.findUnique({ where: { id: reservationId }, include: { customer: true, tour: true } });
  if (!r) return;

  const html = emailLayout(
    "Ödemeniz alındı ✅",
    `<p>Merhaba ${r.customer.firstName},</p>
     <p><b>${r.tour.titleTr}</b> rezervasyonunuz (${r.reference}) için <b>${formatMoney(r.paidMinor)}</b> ödeme alındı.</p>
     <p>${r.balanceMinor > 0 ? `Kalan bakiye: <b>${formatMoney(r.balanceMinor)}</b>.` : "Ödemeniz tamamlanmıştır. İyi tatiller!"}</p>`,
  );

  const result = await sendEmail({ to: r.customer.email, subject: `Ödeme Alındı · ${r.reference}`, html });
  await db.notification.create({
    data: { type: "PAYMENT_RECEIVED", channel: "EMAIL", toEmail: r.customer.email, reservationId: r.id, status: result.ok ? "SENT" : "FAILED", sentAt: result.ok ? new Date() : null, error: result.ok ? null : result.error, payload: { reference: r.reference } },
  });
}
