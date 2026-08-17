"use server";

import { redirect } from "next/navigation";
import { setAdminSession, verifyAdminPassword } from "@/lib/auth/admin";

export type AdminLoginState = {
  error?: string;
};

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/admin");

  if (!verifyAdminPassword(password)) {
    return { error: "Senha incorreta." };
  }

  await setAdminSession();
  redirect(from.startsWith("/admin") ? from : "/admin");
}
