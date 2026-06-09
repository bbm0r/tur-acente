import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_FORM_SETTINGS } from "@/lib/forms";
import { FormBuilder } from "@/components/admin/cms/FormBuilder";
import type { FormField, FormSettings } from "@/lib/blocks";

export const metadata = { title: "Form Düzenleyici" };

export default async function FormEditorHost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({ where: { id }, include: { _count: { select: { submissions: true } } } });
  if (!form) notFound();

  return (
    <FormBuilder
      form={{
        id: form.id,
        name: form.name,
        key: form.key,
        isActive: form.isActive,
        fields: (Array.isArray(form.fields) ? form.fields : []) as FormField[],
        settings: { ...DEFAULT_FORM_SETTINGS, ...((form.settings as Partial<FormSettings>) ?? {}) },
      }}
      submissionCount={form._count.submissions}
    />
  );
}
