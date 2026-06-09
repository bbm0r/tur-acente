import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getDestinationsWithCounts } from "@/lib/catalog";
import { listFormsForPicker } from "@/lib/forms";
import { PageBuilder } from "@/components/admin/cms/PageBuilder";
import type { Block } from "@/lib/blocks";

export const metadata = { title: "Sayfa Düzenleyici" };

export default async function BuilderHost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [page, destinations, media, forms] = await Promise.all([
    db.page.findUnique({ where: { id } }),
    getDestinationsWithCounts(),
    db.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    listFormsForPicker(),
  ]);
  if (!page) notFound();

  return (
    <PageBuilder
      page={{
        id: page.id, titleTr: page.titleTr, slug: page.slug, status: page.status,
        seoTitle: page.seoTitle ?? "", seoDescription: page.seoDescription ?? "",
        blocks: ((page.draftBlocks ?? page.blocks) as unknown as Block[]) ?? [],
      }}
      destinations={destinations.map((d) => ({ slug: d.slug, nameTr: d.nameTr }))}
      media={media.map((m) => ({ id: m.id, fileKey: m.fileKey, fileName: m.fileName }))}
      forms={forms}
      isSystem={page.isSystem}
    />
  );
}
