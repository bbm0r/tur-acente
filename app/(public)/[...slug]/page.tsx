import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Block } from "@/lib/blocks";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

async function getPage(slug: string[]) {
  return db.page.findUnique({ where: { slug: slug.join("/") } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || page.status !== "PUBLISHED") return { title: "Sayfa bulunamadı" };
  return {
    title: page.seoTitle ?? page.titleTr,
    description: page.seoDescription ?? undefined,
    robots: page.noindex ? { index: false } : undefined,
  };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || page.status !== "PUBLISHED") notFound();
  const blocks = (page.blocks as unknown as Block[]) ?? [];
  return <BlockRenderer blocks={blocks} />;
}
