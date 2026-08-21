"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  creatorId: z.string().min(1, "Selecione a criadora."),
  brandId: z.string().min(1, "Selecione a marca."),
  productIds: z.array(z.string()).min(1, "Selecione pelo menos um produto."),
});

export type SampleDeliveryFormState = {
  error?: string;
  success?: boolean;
};

// Um SampleDelivery por produto selecionado — cada um com status próprio,
// atualizável depois individualmente (ver updateSampleDeliveryStatus).
export async function createSampleDelivery(
  _prevState: SampleDeliveryFormState,
  formData: FormData,
): Promise<SampleDeliveryFormState> {
  const parsed = createSchema.safeParse({
    creatorId: formData.get("creatorId"),
    brandId: formData.get("brandId"),
    productIds: formData.getAll("productIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { creatorId, brandId, productIds } = parsed.data;

  await prisma.sampleDelivery.createMany({
    data: productIds.map((productId) => ({ creatorId, brandId, productId })),
  });

  revalidatePath("/admin/amostras");
  revalidatePath("/admin/divulgacoes");
  return { success: true };
}

// Chamada direto como função a partir de um client component (mesmo
// padrão de components/inline-edit-product.tsx) — não presa a um
// <form>, então um throw vira Promise rejeitada, tratável com try/catch.
export async function updateSampleDeliveryStatus(id: string, status: "IN_TRANSIT" | "RECEIVED") {
  await prisma.sampleDelivery.update({ where: { id }, data: { status } });
  revalidatePath("/admin/amostras");
  revalidatePath("/admin/divulgacoes");
}

export async function deleteSampleDelivery(formData: FormData) {
  const id = String(formData.get("sampleDeliveryId") ?? "");
  if (!id) return;
  await prisma.sampleDelivery.delete({ where: { id } });
  revalidatePath("/admin/amostras");
  revalidatePath("/admin/divulgacoes");
}
