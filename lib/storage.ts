import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Adaptador de storage para fotos de marca/produto. Hoje grava em disco local
 * (public/uploads), servido estaticamente pelo Next.js — suficiente para dev
 * e para um primeiro deploy self-hosted. Quando a hospedagem final for
 * escolhida (Vercel Blob / S3 / R2), só esta função precisa mudar.
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Envie JPEG, PNG, WEBP ou AVIF.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Arquivo muito grande. O limite é 5MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  return `/uploads/${filename}`;
}
