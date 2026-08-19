import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { signSessionToken, verifySessionToken } from "./jwt";

const COOKIE_NAME = "xp_creator";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

// Lê o cookie de sessão da criadora (sem senha, ver spec §3/§9). Confirma
// que a linha ainda existe no banco — sem isso, excluir a criadora em
// /admin/criadoras não derrubava quem já tinha sessão salva (o cookie
// assinado continua válido, só o registro some), então o "perde login"
// esperado quando o admin exclui alguém não acontecia de verdade.
export async function getCreatorId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken<{ creatorId: string }>(token);
  if (!payload?.creatorId) return null;
  const exists = await prisma.creator.findUnique({
    where: { id: payload.creatorId },
    select: { id: true },
  });
  return exists ? payload.creatorId : null;
}

export async function setCreatorSession(creatorId: string) {
  const token = await signSessionToken({ creatorId }, "365d");
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearCreatorSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
