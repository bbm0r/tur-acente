import { db } from "@/lib/db";
import { MediaLibrary } from "@/components/admin/cms/MediaLibrary";

export const metadata = { title: "Medya Kütüphanesi" };

export default async function MediaPage() {
  const media = await db.media.findMany({ orderBy: { createdAt: "desc" } });
  return <MediaLibrary media={media.map((m) => ({ id: m.id, fileKey: m.fileKey, fileName: m.fileName, sizeBytes: m.sizeBytes }))} />;
}
