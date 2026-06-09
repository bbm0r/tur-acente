import { NextResponse } from "next/server";
import { getStaffUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { putImage } from "@/lib/storage";

export async function POST(req: Request) {
  const user = await getStaffUser();
  if (!user) return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Dosya bulunamadı" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ ok: false, error: "Yalnızca görsel yüklenebilir" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "En fazla 5MB" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const name = `${crypto.randomUUID()}.${ext}`;
  const fileKey = await putImage(buf, name, file.type);
  const media = await db.media.create({
    data: { fileKey, fileName: file.name, type: "IMAGE", mimeType: file.type, sizeBytes: file.size, uploadedById: user.id },
  });
  return NextResponse.json({ ok: true, media: { id: media.id, fileKey, fileName: media.fileName } });
}
