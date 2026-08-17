"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import type { CreatorFormState } from "./actions";

const initialState: CreatorFormState = {};

export function CreatorForm({
  action,
  defaultValues,
}: {
  action: (prevState: CreatorFormState, formData: FormData) => Promise<CreatorFormState>;
  defaultValues?: { name: string | null; email: string | null; tiktokHandle: string };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isEditing = !!defaultValues;

  return (
    <form action={formAction} className="max-w-md">
      <Field>
        <Label htmlFor="tiktokHandle">@ do TikTok</Label>
        <Input
          id="tiktokHandle"
          name="tiktokHandle"
          placeholder="@usuario"
          defaultValue={defaultValues?.tiktokHandle}
          required
        />
      </Field>
      {isEditing && (
        <>
          <Field>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Preenchido por ela no registro"
              defaultValue={defaultValues?.name ?? ""}
            />
          </Field>
          <Field>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Escolhido por ela no registro"
              defaultValue={defaultValues?.email ?? ""}
            />
          </Field>
        </>
      )}
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
