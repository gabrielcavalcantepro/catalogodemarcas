import "server-only";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "./jwt";

const COOKIE_NAME = "xp_creator";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

// Lê o cookie de sessão da criadora (sem senha, ver spec §3/§9).
export async function getCreatorId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken<{ creatorId: string }>(token);
  return payload?.creatorId ?? null;
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
