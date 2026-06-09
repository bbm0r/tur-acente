"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { DEFAULT_FORM_FIELDS, DEFAULT_FORM_SETTINGS } from "@/lib/forms";
import type { FormField, FormSettings } from "@/lib/blocks";

const SUBMISSION_STATUSES = ["NEW", "READ", "ARCHIVED", "SPAM"] as const;

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

async function uniqueKey(base: string, exceptId?: string) {
  const root = slugify(base) || "form";
  let key = root;
  for (let i = 2; ; i++) {
    const ex = await db.form.findUnique({ where: { key } });
    if (!ex || ex.id === exceptId) return key;
    key = `${root}-${i}`;
  }
}

export async function createFormAction(formData: FormData) {
  await requireStaff();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) redirect("/admin/formlar?e=name");
  const key = await uniqueKey(name);
  const form = await db.form.create({ data: { key, name, fields: DEFAULT_FORM_FIELDS, settings: DEFAULT_FORM_SETTINGS } });
  await db.auditLog.create({ data: { actorRealm: "STAFF", action: "form.create", entity: "form", entityId: form.id } });
  redirect(`/admin/formlar/${form.id}`);
}

export async function saveFormAction(
  id: string,
  data: { name: string; key: string; isActive: boolean; fields: FormField[]; settings: FormSettings },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const existing = await db.form.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Form bulunamadı." };
  if (!data.fields.length) return { ok: false, error: "En az bir alan ekleyin." };

  const key = data.key && slugify(data.key) !== existing.key ? await uniqueKey(data.key, id) : existing.key;
  await db.form.update({
    where: { id },
    data: { name: data.name.trim() || "İsimsiz Form", key, isActive: data.isActive, fields: data.fields, settings: data.settings },
  });
  revalidatePath("/admin/formlar");
  revalidatePath(`/admin/formlar/${id}`);
  return { ok: true };
}

export async function deleteFormAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const form = await db.form.findUnique({ where: { id } });
  if (!form) return { ok: false, error: "Form bulunamadı." };
  await db.formSubmission.deleteMany({ where: { formId: id } });
  await db.form.delete({ where: { id } });
  await db.auditLog.create({ data: { actorRealm: "STAFF", action: "form.delete", entity: "form", entityId: id } });
  revalidatePath("/admin/formlar");
  return { ok: true };
}

export async function setSubmissionStatusAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") || "");
  const formId = String(formData.get("formId") || "");
  const status = String(formData.get("status") || "");
  if (!SUBMISSION_STATUSES.includes(status as (typeof SUBMISSION_STATUSES)[number])) return;
  await db.formSubmission.update({ where: { id }, data: { status: status as (typeof SUBMISSION_STATUSES)[number] } });
  revalidatePath(`/admin/formlar/${formId}/gonderiler`);
}
