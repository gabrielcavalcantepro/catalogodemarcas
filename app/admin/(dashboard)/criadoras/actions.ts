"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { setCatalogLocked } from "@/lib/settings";
import { normalizeEmail, normalizeTiktokHandle } from "@/lib/validation/creator";

// Cadastro pela equipe (allowlist, §5.1) só precisa do @ — nome e e-mail
// são preenchidos pela própria criadora no Registro público.
const createSchema = z.object({
  tiktokHandle: z
    .string()
    .trim()
    .min(2, "Informe o @ do TikTok.")
    .transform(normalizeTiktokHandle),
});

// Edição permite à equipe corrigir/preencher manualmente nome e e-mail
// depois (ex.: suporte, erro de digitação da criadora no registro).
const blankToNull = (value: string) => (value.trim() ? value.trim() : null);

const updateSchema = z.object({
  name: z.string().transform(blankToNull),
  email: z
    .string()
    .transform(blankToNull)
    .refine((value) => value === null || z.string().email().safeParse(value).success, {
      message: "Informe um e-mail válido.",
    })
    .transform((value) => (value ? normalizeEmail(value) : null)),
  tiktokHandle: z
    .string()
    .trim()
    .min(2, "Informe o @ do TikTok.")
    .transform(normalizeTiktokHandle),
});

export type CreatorFormState = {
  error?: string;
};

function uniqueConstraintMessage(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = (e.meta?.target as string[] | undefined) ?? [];
    if (target.includes("email")) return "Já existe uma criadora cadastrada com esse e-mail.";
    if (target.includes("tiktokHandle")) return "Já existe uma criadora cadastrada com esse @.";
    return "Já existe uma criadora cadastrada com esses dados.";
  }
  return null;
}

export async function createCreator(
  _prevState: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  const parsed = createSchema.safeParse({
    tiktokHandle: formData.get("tiktokHandle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.creator.create({ data: parsed.data });
  } catch (e) {
    const message = uniqueConstraintMessage(e);
    if (message) return { error: message };
    throw e;
  }

  revalidatePath("/admin/criadoras");
  redirect("/admin/criadoras?toast=" + encodeURIComponent("Criadora cadastrada."));
}

export async function updateCreator(
  creatorId: string,
  _prevState: CreatorFormState,
  formData: FormData,
): Promise<CreatorFormState> {
  const parsed = updateSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    tiktokHandle: formData.get("tiktokHandle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.creator.findUnique({ where: { id: creatorId } });
  if (!existing) {
    return { error: "Criadora não encontrada." };
  }

  try {
    await prisma.creator.update({ where: { id: creatorId }, data: parsed.data });
  } catch (e) {
    const message = uniqueConstraintMessage(e);
    if (message) return { error: message };
    throw e;
  }

  revalidatePath("/admin/criadoras");
  redirect("/admin/criadoras?toast=" + encodeURIComponent("Criadora atualizada."));
}

export async function deleteCreator(formData: FormData) {
  const creatorId = String(formData.get("creatorId") ?? "");
  if (!creatorId) return;
  await prisma.creator.delete({ where: { id: creatorId } });
  revalidatePath("/admin/criadoras");
}

// Só organizacional — não afeta acesso. A criadora que se registrou
// sozinha (catálogo destrancado) já loga e navega normalmente antes
// disso; "Aprovar" só marca que a equipe já olhou o cadastro.
export async function approveCreator(formData: FormData) {
  const creatorId = String(formData.get("creatorId") ?? "");
  if (!creatorId) return;
  await prisma.creator.update({ where: { id: creatorId }, data: { approved: true } });
  revalidatePath("/admin/criadoras");
}

export async function updateCatalogLocked(locked: boolean) {
  await setCatalogLocked(locked);
  revalidatePath("/admin/criadoras");
}
