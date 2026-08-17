"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const setLimitSchema = z.object({
  creatorId: z.string().min(1, "Selecione a criadora."),
  brandId: z.string().min(1, "Selecione a marca."),
  limit: z.coerce.number().int().min(0, "O limite não pode ser negativo."),
});

export type LimitFormState = {
  error?: string;
  success?: boolean;
};

export async function setCreatorBrandLimit(
  _prevState: LimitFormState,
  formData: FormData,
): Promise<LimitFormState> {
  const parsed = setLimitSchema.safeParse({
    creatorId: formData.get("creatorId"),
    brandId: formData.get("brandId"),
    limit: formData.get("limit"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.creatorBrandLimit.upsert({
    where: {
      creatorId_brandId: {
        creatorId: parsed.data.creatorId,
        brandId: parsed.data.brandId,
      },
    },
    update: { limit: parsed.data.limit },
    create: parsed.data,
  });

  revalidatePath("/admin/limites");
  return { success: true };
}
