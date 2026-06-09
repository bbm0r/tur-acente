"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getFormByKey, validateSubmission, mapLead } from "@/lib/forms";

export type SubmitResult = { ok: true; message: string } | { ok: false; error: string };

/** Public form submission: validate → store submission → optional CRM lead → notify. */
export async function submitFormAction(key: string, input: Record<string, unknown>): Promise<SubmitResult> {
  const form = await getFormByKey(key);
  if (!form || !form.isActive) return { ok: false, error: "Form şu anda kullanılamıyor." };

  const v = validateSubmission(form, input);
  if (!v.ok) return v;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = h.get("user-agent") || null;

  let leadId: string | null = null;
  if (form.settings.createLead) {
    const lead = await db.lead.create({
      data: { ...mapLead(form, v.data), channel: "DIRECT_WEB", status: "NEW" },
    });
    leadId = lead.id;
  }

  await db.formSubmission.create({
    data: { formId: form.id, data: v.data, status: "NEW", leadId, ip, userAgent },
  });

  if (form.settings.notify) {
    await db.notification.create({
      data: { type: "ADMIN_ALERT", channel: "EMAIL", status: "QUEUED", payload: { kind: "form", form: form.name } },
    });
  }

  return { ok: true, message: form.settings.successMessage };
}
