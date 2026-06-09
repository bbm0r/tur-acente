import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import type { Block } from "@/lib/blocks";

export async function StaticPage({ slug }: { slug: string }) {
  const page = await db.page.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();

  const blocks = (page.blocks as unknown as Block[]) ?? [];
  if (blocks.length > 0) return <BlockRenderer blocks={blocks} />;

  // fallback for legacy pages that only have bodyTr
  return (
    <div className="bg-slate-50">
      <div className="container-page max-w-3xl py-12">
        <h1 className="text-3xl font-extrabold text-ink">{page.titleTr}</h1>
        <div className="mt-6 whitespace-pre-line leading-relaxed text-ink-soft">{page.bodyTr}</div>
      </div>
    </div>
  );
}
