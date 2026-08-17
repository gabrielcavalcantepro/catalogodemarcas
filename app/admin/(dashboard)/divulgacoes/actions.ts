"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const contentPostSchema = z.object({
  creatorId: z.string().min(1, "Selecione a criadora."),
  brandId: z.string().min(1, "Selecione a marca."),
  productId: z.string().optional(),
  contentType: z.enum(["VIDEO", "LIVE", "STORY"]),
  postDate: z.string().min(1, "Informe a data."),
  link: z.string().trim().optional(),
});

export type ContentPostFormState = {
  error?: string;
  success?: boolean;
};

export async function createContentPost(
  _prevState: ContentPostFormState,
  formData: FormData,
): Promise<ContentPostFormState> {
  const parsed = contentPostSchema.safeParse({
    creatorId: formData.get("creatorId"),
    brandId: formData.get("brandId"),
    productId: formData.get("productId") || undefined,
    contentType: formData.get("contentType"),
    postDate: formData.get("postDate"),
    link: formData.get("link") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { postDate, link, productId, ...rest } = parsed.data;

  await prisma.contentPost.create({
    data: {
      ...rest,
      productId: productId || null,
      link: link || null,
      postDate: new Date(postDate),
    },
  });

  revalidatePath("/admin/divulgacoes");
  return { success: true };
}

export async function deleteContentPost(formData: FormData) {
  const id = String(formData.get("contentPostId") ?? "");
  if (!id) return;
  await prisma.contentPost.delete({ where: { id } });
  revalidatePath("/admin/divulgacoes");
}
