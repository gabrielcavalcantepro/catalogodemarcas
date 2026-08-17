import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { signSessionToken, verifySessionToken } from "./jwt";

const COOKIE_NAME = "xp_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = await verifySessionToken<{ admin: boolean }>(token);
  return payload?.admin === true;
}

export async function setAdminSession() {
  const token = await signSessionToken({ admin: true }, "30d");
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

// Comparação em tempo constante para evitar timing attack na senha compartilhada.
export function verifyAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const inputBuf = Buffer.from(input);
  const expectedBuf = Buffer.from(expected);
  if (inputBuf.length !== expectedBuf.length) {
    // Ainda assim compara contra um buffer de tamanho igual para não vazar
    // o tamanho da senha via timing.
    timingSafeEqual(inputBuf, inputBuf);
    return false;
  }
  return timingSafeEqual(inputBuf, expectedBuf);
}
