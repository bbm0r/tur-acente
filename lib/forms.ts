import "server-only";
import { db } from "./db";
import type { FormField, FormSettings } from "./blocks";

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  successMessage: "Mesajınız alındı! Ekibimiz en kısa sürede sizinle iletişime geçecek.",
  createLead: true,
  notify: true,
};

export const DEFAULT_FORM_FIELDS: FormField[] = [
  { key: "name", label: "Ad Soyad", type: "text", required: true },
  { key: "email", label: "E-posta", type: "email", required: true },
  { key: "phone", label: "Telefon", type: "tel", required: true },
  { key: "message", label: "Mesajınız", type: "textarea", required: false },
];

export type NormalizedForm = {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  fields: FormField[];
  settings: FormSettings;
};

function normalize(f: { id: string; key: string; name: string; isActive: boolean; fields: unknown; settings: unknown }): NormalizedForm {
  return {
    id: f.id,
    key: f.key,
    name: f.name,
    isActive: f.isActive,
    fields: Array.isArray(f.fields) ? (f.fields as FormField[]) : [],
    settings: { ...DEFAULT_FORM_SETTINGS, ...((f.settings as Partial<FormSettings>) ?? {}) },
  };
}

export async function getFormByKey(key: string): Promise<NormalizedForm | null> {
  const f = await db.form.findUnique({ where: { key } });
  return f ? normalize(f) : null;
}

export async function getFormById(id: string): Promise<NormalizedForm | null> {
  const f = await db.form.findUnique({ where: { id } });
  return f ? normalize(f) : null;
}

/** Lightweight list for the page-builder form picker. */
export function listFormsForPicker() {
  return db.form.findMany({ orderBy: { name: "asc" }, select: { key: true, name: true } });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validate raw submitted input against a form's field definitions. */
export function validateSubmission(
  form: NormalizedForm,
  input: Record<string, unknown> | null | undefined,
): { ok: true; data: Record<string, string> } | { ok: false; error: string } {
  const data: Record<string, string> = {};
  for (const f of form.fields) {
    const raw = input?.[f.key];
    const v = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw);
    if (f.required && !v) return { ok: false, error: `${f.label} alanı zorunlu.` };
    if (f.type === "email" && v && !EMAIL_RE.test(v)) return { ok: false, error: "Geçerli bir e-posta girin." };
    data[f.key] = v;
  }
  return { ok: true, data };
}

/** Map a validated submission onto Lead columns, by well-known keys then by field type. */
export function mapLead(form: NormalizedForm, data: Record<string, string>) {
  const byType = (t: FormField["type"]) => {
    const f = form.fields.find((x) => x.type === t);
    return f ? data[f.key] : "";
  };
  const name = data.name || byType("text") || "Form gönderimi";
  const email = data.email || byType("email") || "";
  const phone = data.phone || byType("tel") || "";
  const message = data.message || byType("textarea") || "";
  return { name: String(name), email: String(email), phone: String(phone), message: String(message) };
}
