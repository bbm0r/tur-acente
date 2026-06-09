import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getStaffUser } from "@/lib/auth";
import { formatDateTimeTr } from "@/lib/utils";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { Block } from "@/lib/blocks";

export const metadata: Metadata = { robots: { index: false } };

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rev?: string }>;
}) {
  const user = await getStaffUser();
  if (!user) redirect("/admin/giris");

  const { id } = await params;
  const { rev } = await searchParams;
  const page = await db.page.findUnique({ where: { id } });
  if (!page) notFound();

  // When ?rev is given, preview that saved version's blocks instead of the live page.
  const revision = rev ? await db.pageRevision.findUnique({ where: { id: rev } }) : null;
  const usingRevision = !!revision && revision.pageId === id;
  const blocks = ((usingRevision ? revision!.blocks : (page.draftBlocks ?? page.blocks)) as unknown as Block[]) ?? [];

  return (
    <>
      <div className="bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-ink">
        ÖNİZLEME · {usingRevision ? `Sürüm: ${formatDateTimeTr(revision!.createdAt)}` : page.status === "PUBLISHED" ? "Yayında" : "Taslak"} · /{page.slug}
      </div>
      <Header />
      <main className="min-h-[50vh]">
        {blocks.length ? <BlockRenderer blocks={blocks} /> : (
          <div className="container-page py-24 text-center text-ink-muted">Henüz blok eklenmedi. Soldaki panelden blok ekleyin.</div>
        )}
      </main>
      <Footer />
    </>
  );
}
