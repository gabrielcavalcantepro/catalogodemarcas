"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function markSampleRequestDone(formData: FormData) {
  const id = String(formData.get("sampleRequestId") ?? "");
  if (!id) return;
  await prisma.sampleRequest.update({
    where: { id },
    data: { status: "DONE" },
  });
  revalidatePath("/admin/fila");
}

export async function markSampleRequestPending(formData: FormData) {
  const id = String(formData.get("sampleRequestId") ?? "");
  if (!id) return;
  await prisma.sampleRequest.update({
    where: { id },
    data: { status: "PENDING" },
  });
  revalidatePath("/admin/fila");
}
