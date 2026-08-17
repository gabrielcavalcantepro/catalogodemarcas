"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { saveUploadedImage } from "@/lib/storage";

const brandSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da marca."),
  defaultSampleLimit: z.coerce
    .number()
    .int()
    .min(0, "O limite padrão não pode ser negativo."),
});

export type BrandFormState = {
  error?: string;
};

async function resolveLogoUrl(formData: FormData, currentUrl: string | null) {
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    return saveUploadedImage(file);
  }
  return currentUrl;
}

export async function createBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    defaultSampleLimit: formData.get("defaultSampleLimit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let logoUrl: string | null = null;
  try {
    logoUrl = await resolveLogoUrl(formData, null);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao enviar a logo." };
  }

  await prisma.brand.create({
    data: { ...parsed.data, logoUrl },
  });

  revalidatePath("/admin/marcas");
  revalidatePath("/");
  redirect("/admin/marcas?toast=" + encodeURIComponent("Marca criada."));
}

export async function updateBrand(
  brandId: string,
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    defaultSampleLimit: formData.get("defaultSampleLimit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!existing) {
    return { error: "Marca não encontrada." };
  }

  let logoUrl: string | null;
  try {
    logoUrl = await resolveLogoUrl(formData, existing.logoUrl);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao enviar a logo." };
  }

  await prisma.brand.update({
    where: { id: brandId },
    data: { ...parsed.data, logoUrl },
  });

  revalidatePath("/admin/marcas");
  revalidatePath("/");
  redirect("/admin/marcas?toast=" + encodeURIComponent("Marca atualizada."));
}

export async function deleteBrand(formData: FormData) {
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) return;
  await prisma.brand.delete({ where: { id: brandId } });
  revalidatePath("/admin/marcas");
  revalidatePath("/");
}
