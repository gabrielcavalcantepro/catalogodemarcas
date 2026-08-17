"use client";

import { useActionState } from "react";
import Image from "next/image";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import type { BrandFormState } from "./actions";

const initialState: BrandFormState = {};

export function BrandForm({
  action,
  defaultValues,
}: {
  action: (prevState: BrandFormState, formData: FormData) => Promise<BrandFormState>;
  defaultValues?: { name: string; defaultSampleLimit: number; logoUrl: string | null };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-md">
      <Field>
        <Label htmlFor="name">Nome da marca</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </Field>
      <Field>
        <Label htmlFor="defaultSampleLimit">Limite padrão de amostras por criadora</Label>
        <Input
          id="defaultSampleLimit"
          name="defaultSampleLimit"
          type="number"
          min={0}
          defaultValue={defaultValues?.defaultSampleLimit ?? 1}
          required
        />
      </Field>
      <Field>
        <Label htmlFor="logo">Logo / identidade visual</Label>
        {defaultValues?.logoUrl && (
          <div className="mb-2">
            <Image
              src={defaultValues.logoUrl}
              alt="Logo atual"
              width={120}
              height={40}
              className="rounded border border-graphite bg-white object-contain p-2"
            />
          </div>
        )}
        <Input id="logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/avif" />
      </Field>
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
