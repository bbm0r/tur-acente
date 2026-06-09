"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Ad gerekli"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().min(7, "Telefon gerekli"),
  message: z.string().min(2, "Mesaj gerekli"),
});

export type LeadResult = { ok: true } | { ok: false; error: string };

export async function createLeadAction(input: unknown): Promise<LeadResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Form hatalı." };

  await db.lead.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      channel: "DIRECT_WEB",
      status: "NEW",
    },
  });
  await db.notification.create({
    data: { type: "ADMIN_ALERT", channel: "EMAIL", status: "QUEUED", payload: { kind: "lead", name: parsed.data.name } },
  });
  return { ok: true };
}
