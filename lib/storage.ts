import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Image storage. Uses S3-compatible object storage (AWS S3 / Cloudflare R2) when configured
 * via env, otherwise falls back to the local `public/uploads` folder (dev only — ephemeral on
 * serverless hosts like Vercel, which is why object storage is required in production).
 *
 * To enable object storage set: S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL,
 * and (for R2 or non-AWS) S3_ENDPOINT + S3_REGION (R2 uses region "auto").
 */
const S3_BUCKET = process.env.S3_BUCKET;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

export const usingObjectStorage = !!(S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_PUBLIC_URL);

/** Stores an image and returns its public URL (fileKey). */
export async function putImage(buf: Buffer, name: string, contentType: string): Promise<string> {
  if (usingObjectStorage) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: S3_REGION,
      ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
      credentials: { accessKeyId: S3_ACCESS_KEY_ID!, secretAccessKey: S3_SECRET_ACCESS_KEY! },
    });
    const key = `uploads/${name}`;
    await client.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: buf, ContentType: contentType }));
    return `${S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}`;
  }

  // Local fallback (dev). Ephemeral on serverless — configure object storage for production.
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}
