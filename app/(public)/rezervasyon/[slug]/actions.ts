"use server";

import { z } from "zod";
import { quote, type QuoteInput } from "@/lib/pricing";
import { createReservation } from "@/lib/reservations";
import { sendReservationConfirmation } from "@/lib/notify";
import { grantBookingView } from "@/lib/auth";

const quoteSchema = z.object({
  tourDateId: z.string().min(1),
  roomTypeCode: z.string().min(1),
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(9),
  infants: z.number().int().min(0).max(9),
  extraIds: z.array(z.string()),
});

export async function getQuoteAction(input: QuoteInput) {
  const data = quoteSchema.parse(input);
  return await quote(data);
}

const submitSchema = quoteSchema.extend({
  tourId: z.string().min(1),
  lead: z.object({
    firstName: z.string().min(2, "Ad gerekli"),
    lastName: z.string().min(2, "Soyad gerekli"),
    email: z.string().email("Geçerli e-posta girin"),
    phone: z.string().min(7, "Telefon gerekli"),
    birthDate: z.string().optional(),
    nationality: z.string().optional(),
  }),
  paymentMethod: z.enum(["BANK_TRANSFER", "CREDIT_CARD"]).nullable(),
  kvkkConsent: z.boolean(),
});

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

export async function submitReservationAction(input: unknown): Promise<SubmitResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Lütfen formu kontrol edin." };
  }
  if (!parsed.data.kvkkConsent) {
    return { ok: false, error: "Devam etmek için KVKK onayı gereklidir." };
  }
  try {
    const r = await createReservation(parsed.data);
    // authorize THIS visitor to view their confirmation page (signed cookie)
    await grantBookingView(r.reference);
    // best-effort confirmation email; never fail the booking on email error
    try { await sendReservationConfirmation(r.reference); } catch {}
    return { ok: true, reference: r.reference };
  } catch (e: any) {
    if (e?.message === "SOLD_OUT")
      return { ok: false, error: "Seçtiğiniz tarih için yeterli kontenjan kalmadı." };
    return { ok: false, error: "Rezervasyon oluşturulamadı. Lütfen tekrar deneyin." };
  }
}
