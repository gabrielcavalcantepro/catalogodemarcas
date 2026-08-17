"use client";

import { useActionState } from "react";
import { loginAdmin, type AdminLoginState } from "./actions";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import { Logo } from "@/components/logo";

const initialState: AdminLoginState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm rounded-[20px] bg-charcoal p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <h1 className="mb-1 font-display text-heading-sm text-paper">Painel da equipe</h1>
      <p className="mb-6 text-sm text-mist">Acesso interno X Performance.</p>
      <input type="hidden" name="from" value={from} />
      <Field>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required autoFocus />
      </Field>
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
