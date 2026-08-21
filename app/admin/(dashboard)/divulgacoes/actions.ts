"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const contentPostSchema = z.object({
  creatorId: z.string().min(1, "Selecione a criadora."),
  brandId: z.string().min(1, "Selecione a marca."),
  productId: z.string().min(1, "Selecione o produto."),
  contentType: z.enum(["VIDEO", "LIVE"]),
  postDate: z.string().min(1, "Informe a data."),
  link: z.string().trim().optional(),
});

export type ContentPostFormState = {
  error?: string;
  success?: boolean;
};

// productId é obrigatório pros dois tipos (toda live também é pra vender um
// produto) e restrito, no form, aos produtos RECEIVED daquela criadora+marca
// (não os "Em trânsito") — reconferido aqui contra SampleDelivery em vez de
// confiar só na restrição client-side do dropdown.
export async function createContentPost(
  _prevState: ContentPostFormState,
  formData: FormData,
): Promise<ContentPostFormState> {
  const parsed = contentPostSchema.safeParse({
    creatorId: formData.get("creatorId"),
    brandId: formData.get("brandId"),
    productId: formData.get("productId"),
    contentType: formData.get("contentType"),
    postDate: formData.get("postDate"),
    link: formData.get("link") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { postDate, link, creatorId, brandId, productId, contentType } = parsed.data;

  const hasReceivedDelivery = await prisma.sampleDelivery.findFirst({
    where: { creatorId, brandId, productId, status: "RECEIVED" },
    select: { id: true },
  });
  if (!hasReceivedDelivery) {
    return { error: "Essa criadora não tem esse produto recebido dessa marca." };
  }

  await prisma.contentPost.create({
    data: {
      creatorId,
      brandId,
      productId,
      contentType,
      link: contentType === "VIDEO" ? link || null : null,
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
