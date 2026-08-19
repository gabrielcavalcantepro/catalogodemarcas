"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";

const priceField = (label: string) =>
  z.coerce.number().min(0, `O ${label} não pode ser negativo.`);
const commissionField = (label: string) =>
  z.coerce
    .number()
    .min(0, `A comissão (${label}) não pode ser negativa.`)
    .max(100, `A comissão (${label}) não pode passar de 100%.`);

const productSchema = z
  .object({
    brandId: z.string().min(1, "Selecione uma marca."),
    name: z.string().trim().min(2, "Informe o nome do produto."),
    description: z.string().trim().min(1, "Informe a descrição."),
    showcasePrice: priceField("preço de vitrine"),
    showcaseCommissionPercent: commissionField("vitrine"),
    // Oferta relâmpago é opcional, mas os dois campos andam juntos.
    flashPrice: z
      .string()
      .trim()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
        message: "O preço de oferta relâmpago não pode ser negativo.",
      }),
    flashCommissionPercent: z
      .string()
      .trim()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0 && v <= 100), {
        message: "A comissão (oferta relâmpago) deve estar entre 0 e 100%.",
      }),
    requestBehavior: z.enum(["REDIRECT_TIKTOK_SHOP", "NOTIFY_TEAM"]),
    tiktokShopUrl: z.string().trim().optional(),
    active: z.coerce.boolean().optional().default(true),
  })
  .refine(
    (data) =>
      data.requestBehavior !== "REDIRECT_TIKTOK_SHOP" ||
      (data.tiktokShopUrl && data.tiktokShopUrl.length > 0),
    { message: "Informe a URL da loja no TikTok Shop.", path: ["tiktokShopUrl"] },
  )
  .refine((data) => (data.flashPrice === null) === (data.flashCommissionPercent === null), {
    message: "Preencha preço e comissão da oferta relâmpago juntos, ou deixe os dois em branco.",
    path: ["flashPrice"],
  });

export type ProductFormState = {
  error?: string;
};

function parseDifferentials(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

async function saveNewPhotos(formData: FormData): Promise<string[]> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  // Cada arquivo já é validado individualmente em saveUploadedImage, mas o
  // input aceita múltiplos — várias fotos dentro do limite cada uma podem
  // somar mais do que a Server Action consegue receber (ver
  // lib/upload-limits.ts). Sem essa checagem, o envio nem chega aqui: a
  // requisição é rejeitada antes (413 na Vercel, ou o erro genérico do
  // Next se bodySizeLimit for excedido), então isso é defesa em
  // profundidade — a checagem que realmente evita o crash é a validação
  // no client, em product-form.tsx.
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > MAX_UPLOAD_BYTES) {
    throw new Error(`O total das fotos enviadas passa de ${MAX_UPLOAD_LABEL}. Envie menos fotos ou arquivos menores.`);
  }

  const urls: string[] = [];
  for (const file of files) {
    urls.push(await saveUploadedImage(file));
  }
  return urls;
}

function baseInput(formData: FormData) {
  return {
    brandId: formData.get("brandId"),
    name: formData.get("name"),
    description: formData.get("description"),
    showcasePrice: formData.get("showcasePrice"),
    showcaseCommissionPercent: formData.get("showcaseCommissionPercent"),
    flashPrice: formData.get("flashPrice") ?? "",
    flashCommissionPercent: formData.get("flashCommissionPercent") ?? "",
    requestBehavior: formData.get("requestBehavior"),
    tiktokShopUrl: formData.get("tiktokShopUrl") || undefined,
    active: formData.get("active") === "on",
  };
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse({ ...baseInput(formData), active: true });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let photoUrls: string[];
  try {
    photoUrls = await saveNewPhotos(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao enviar fotos." };
  }

  const { tiktokShopUrl, ...rest } = parsed.data;

  await prisma.product.create({
    data: {
      ...rest,
      tiktokShopUrl: tiktokShopUrl || null,
      differentials: parseDifferentials(formData.get("differentials")),
      photoUrls,
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos?toast=" + encodeURIComponent("Produto criado."));
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = productSchema.safeParse(baseInput(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) {
    return { error: "Produto não encontrado." };
  }

  let newPhotoUrls: string[];
  try {
    newPhotoUrls = await saveNewPhotos(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao enviar fotos." };
  }

  const toRemove = new Set(formData.getAll("removePhotos").map(String));
  const keptPhotoUrls = existing.photoUrls.filter((url) => !toRemove.has(url));

  const { tiktokShopUrl, ...rest } = parsed.data;

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...rest,
      tiktokShopUrl: tiktokShopUrl || null,
      differentials: parseDifferentials(formData.get("differentials")),
      photoUrls: [...keptPhotoUrls, ...newPhotoUrls],
    },
  });

  revalidatePath("/admin/produtos");
  revalidatePath("/");
  redirect("/admin/produtos?toast=" + encodeURIComponent("Produto atualizado."));
}

export async function deleteProduct(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function duplicateProduct(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;

  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) return;

  // Reaproveita as fotos já hospedadas (mesma URL, sem re-upload) — inativo
  // por padrão pra não aparecer na vitrine com nome/preço idênticos ao
  // original até a equipe revisar e ajustar o que for diferente.
  const duplicate = await prisma.product.create({
    data: {
      brandId: existing.brandId,
      name: `${existing.name} (cópia)`,
      description: existing.description,
      differentials: existing.differentials,
      showcasePrice: existing.showcasePrice,
      showcaseCommissionPercent: existing.showcaseCommissionPercent,
      flashPrice: existing.flashPrice,
      flashCommissionPercent: existing.flashCommissionPercent,
      photoUrls: existing.photoUrls,
      requestBehavior: existing.requestBehavior,
      tiktokShopUrl: existing.tiktokShopUrl,
      active: false,
    },
  });

  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${duplicate.id}?toast=${encodeURIComponent("Produto duplicado como inativo. Ajuste os campos e salve.")}`);
}
