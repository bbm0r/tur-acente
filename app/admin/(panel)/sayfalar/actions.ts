"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

async function requireStaff() {
  const u = await getStaffUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export async function createPageAction(title: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireStaff();
  const t = (title || "").trim();
  if (t.length < 2) return { ok: false, error: "Başlık girin." };
  const base = slugify(t) || "sayfa";
  let slug = base;
  for (let i = 2; await db.page.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
  const page = await db.page.create({ data: { slug, titleTr: t, blocks: [], status: "DRAFT" } });
  await db.auditLog.create({ data: { actorRealm: "STAFF", action: "page.create", entity: "page", entityId: page.id } });
  return { ok: true, id: page.id };
}

export async function savePageAction(
  id: string,
  data: { titleTr: string; slug: string; blocks: any; seoTitle: string; seoDescription: string },
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await requireStaff();
  const existing = await db.page.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Bulunamadı." };
  // Legal/system pages keep their slug fixed (their public routes depend on it).
  const newSlug = existing.isSystem ? "" : slugify(data.slug);
  if (newSlug && newSlug !== existing.slug) {
    const ex = await db.page.findUnique({ where: { slug: newSlug } });
    if (ex && ex.id !== id) return { ok: false, error: "Bu URL zaten kullanımda." };
  }
  const page = await db.page.update({
    where: { id },
    data: {
      titleTr: data.titleTr || "Başlıksız",
      ...(newSlug ? { slug: newSlug } : {}),
      blocks: data.blocks,
      draftBlocks: data.blocks, // keep the live-preview draft in sync with the published copy
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
    },
  });
  await db.pageRevision.create({
    data: { pageId: id, editorId: u.id, title: page.titleTr, blocks: data.blocks, note: note?.trim() || null },
  });
  revalidatePath(`/${page.slug}`);
  revalidatePath(`/onizle/${id}`);
  return { ok: true };
}

/** Debounced live-preview autosave from the editor: stores only the draft working copy
 *  (no revision, no publish) so /onizle reflects edits without an explicit save. */
export async function autosavePageAction(id: string, blocks: any): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const existing = await db.page.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false, error: "Bulunamadı." };
  await db.page.update({ where: { id }, data: { draftBlocks: blocks } });
  revalidatePath(`/onizle/${id}`);
  return { ok: true };
}

export type RevisionSummary = { id: string; title: string; note: string | null; editorName: string | null; createdAt: string; blockCount: number };

/** Newest-first list of saved versions for a page (metadata only — no block payload). */
export async function listPageRevisionsAction(pageId: string): Promise<RevisionSummary[]> {
  await requireStaff();
  const rows = await db.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      note: true,
      blocks: true,
      createdAt: true,
      editor: { select: { firstName: true, lastName: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    note: r.note,
    editorName: r.editor ? `${r.editor.firstName} ${r.editor.lastName}`.trim() : null,
    createdAt: r.createdAt.toISOString(),
    blockCount: Array.isArray(r.blocks) ? r.blocks.length : 0,
  }));
}

/** Fetch one revision's restorable content (title + blocks), scoped to its page. */
export async function getPageRevisionAction(
  pageId: string,
  revisionId: string,
): Promise<{ ok: true; title: string; blocks: any } | { ok: false; error: string }> {
  await requireStaff();
  const rev = await db.pageRevision.findUnique({ where: { id: revisionId } });
  if (!rev || rev.pageId !== pageId) return { ok: false, error: "Sürüm bulunamadı." };
  return { ok: true, title: rev.title, blocks: rev.blocks };
}

export async function publishPageAction(id: string, publish: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await requireStaff();
  const page = await db.page.update({ where: { id }, data: { status: publish ? "PUBLISHED" : "DRAFT", publishedAt: publish ? new Date() : null } });
  await db.auditLog.create({ data: { actorUserId: u.id, actorRealm: "STAFF", action: publish ? "page.publish" : "page.unpublish", entity: "page", entityId: id } });
  revalidatePath(`/${page.slug}`);
  revalidatePath("/admin/sayfalar");
  return { ok: true };
}

export async function deletePageAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff();
  const page = await db.page.findUnique({ where: { id } });
  if (!page) return { ok: false, error: "Bulunamadı." };
  if (page.isSystem) return { ok: false, error: "Yasal sayfa silinemez." };
  await db.pageRevision.deleteMany({ where: { pageId: id } });
  await db.page.delete({ where: { id } });
  revalidatePath("/admin/sayfalar");
  return { ok: true };
}
