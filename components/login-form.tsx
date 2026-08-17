"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginCreator, type AuthState } from "@/app/(public)/actions";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginCreator, initialState);

  return (
    <form
      action={formAction}
      className="mx-auto mt-16 w-full max-w-[380px] rounded-[20px] bg-charcoal p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <h1 className="mb-1 font-display text-heading-sm text-paper">
        Bem-vinda de volta à X Performance
      </h1>
      <p className="mb-6 text-sm text-mist">
        Digite seu e-mail e seu @ do TikTok para acessar o catálogo.
      </p>
      <Field>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
      </Field>
      <Field>
        <Label htmlFor="tiktokHandle">@ do TikTok</Label>
        <Input id="tiktokHandle" name="tiktokHandle" placeholder="@seuusuario" required />
      </Field>
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
      <p className="mt-4 text-center text-sm text-mist">
        Primeiro acesso?{" "}
        <Link href="/registro" className="text-mist underline decoration-transparent hover:text-gold hover:decoration-gold">
          Complete seu registro
        </Link>
      </p>
    </form>
  );
}
