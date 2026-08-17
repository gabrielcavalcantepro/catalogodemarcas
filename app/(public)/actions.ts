"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getCreatorId, setCreatorSession } from "@/lib/auth/creator";
import { normalizeEmail, normalizeTiktokHandle } from "@/lib/validation/creator";

const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.").transform(normalizeEmail),
  tiktokHandle: z
    .string()
    .trim()
    .min(2, "Informe seu @ do TikTok.")
    .transform(normalizeTiktokHandle),
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome."),
});

export type AuthState = {
  error?: string;
};

// Registro (primeiro acesso, §3/§6.3): só aceito se o @ bater com um
// cadastro que a equipe já fez em /admin/criadoras — o e-mail não faz
// parte desse cadastro prévio, é escolhido pela própria criadora aqui e
// passa a ser exigido (junto com o @) em todo login seguinte.
export async function registerCreator(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    tiktokHandle: formData.get("tiktokHandle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, email, tiktokHandle } = parsed.data;

  const creator = await prisma.creator.findFirst({ where: { tiktokHandle } });
  if (!creator) {
    return {
      error: "@ não encontrado. Peça para a equipe X Performance te cadastrar antes de acessar.",
    };
  }
  if (creator.name) {
    return { error: "Esse cadastro já foi registrado. Use a tela de login." };
  }

  try {
    await prisma.creator.update({ where: { id: creator.id }, data: { name, email } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "Esse e-mail já está sendo usado por outra criadora." };
    }
    throw e;
  }

  await setCreatorSession(creator.id);
  revalidatePath("/", "layout");
  redirect("/");
}

// Login (demais acessos, §3/§6.3): sempre exige e-mail + @ quando não há
// sessão salva no dispositivo.
export async function loginCreator(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    tiktokHandle: formData.get("tiktokHandle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { email, tiktokHandle } = parsed.data;

  const creator = await prisma.creator.findFirst({ where: { email, tiktokHandle } });
  if (!creator) {
    return { error: "E-mail ou @ não encontrados." };
  }
  if (!creator.name) {
    return { error: "Cadastro ainda não finalizado. Complete seu registro primeiro." };
  }

  await setCreatorSession(creator.id);
  revalidatePath("/", "layout");
  redirect("/");
}

const requestSampleSchema = z.object({
  productId: z.string().min(1),
});

export type RequestSampleState = {
  success?: boolean;
};

// (prevState, formData) em vez de só (formData) pra dar pra usar
// useActionState no client e disparar um toast sem navegação quando não
// há redirect (caminho NOTIFY_TEAM — o card já troca de botão pra badge
// via revalidação, mas precisa confirmar a ação com um toast curto).
export async function requestSample(
  _prevState: RequestSampleState,
  formData: FormData,
): Promise<RequestSampleState> {
  const parsed = requestSampleSchema.safeParse({
    productId: formData.get("productId"),
  });
  if (!parsed.success) {
    throw new Error("Produto inválido.");
  }

  const creatorId = await getCreatorId();
  if (!creatorId) {
    throw new Error("Sessão não identificada.");
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product || !product.active) {
    throw new Error("Produto não encontrado.");
  }

  try {
    await prisma.sampleRequest.create({
      data: {
        creatorId,
        productId: product.id,
        brandId: product.brandId,
        behaviorAtRequest: product.requestBehavior,
      },
    });
  } catch (e) {
    // Já solicitado (constraint @@unique([creatorId, productId])) — a UI
    // não deveria permitir isso (botão vira badge depois do 1º pedido),
    // mas cobre a race de clique duplo antes do re-render. No-op.
    const isDuplicate = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
    if (!isDuplicate) throw e;
  }

  revalidatePath("/");
  revalidatePath("/produto/" + product.id);
  revalidatePath("/minhas-solicitacoes");

  if (product.requestBehavior === "REDIRECT_TIKTOK_SHOP" && product.tiktokShopUrl) {
    redirect(product.tiktokShopUrl);
  }

  return { success: true };
}
