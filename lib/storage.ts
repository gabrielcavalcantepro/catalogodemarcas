import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";

// service role key só é lida aqui — módulo "server-only" (build falha se
// algum "use client" importar isso) e sem prefixo NEXT_PUBLIC_, então
// nunca entra no bundle do browser.
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKET = "product-photos";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

/**
 * Adaptador de storage para fotos de marca/produto — Supabase Storage,
 * bucket "product-photos" (já existe, criado fora do código). Upload
 * sempre no servidor, com a service role key (bypassa RLS do bucket).
 */
export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Tipo de arquivo não suportado. Envie JPEG, PNG, WEBP ou AVIF.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Arquivo muito grande. O limite é ${MAX_UPLOAD_LABEL}.`);
  }

  const ext = file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(filename, bytes, {
    contentType: file.type,
  });
  if (error) {
    throw new Error(`Falha ao enviar imagem: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
