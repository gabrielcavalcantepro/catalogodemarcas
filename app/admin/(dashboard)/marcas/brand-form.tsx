"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
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
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setLogoError(
      file && file.size > MAX_UPLOAD_BYTES ? `O arquivo passa de ${MAX_UPLOAD_LABEL}. Escolha um arquivo menor.` : null,
    );
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  return (
    <form action={formAction} className="mx-auto max-w-md">
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
        <Input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onChange={handleLogoChange}
        />
        <ErrorText>{logoError}</ErrorText>
        {logoPreview && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:), next/image não serve URLs de objeto */}
            <img
              src={logoPreview}
              alt="Prévia da logo selecionada"
              className="rounded border border-graphite bg-white object-contain p-2"
              width={120}
              height={40}
            />
          </div>
        )}
      </Field>
      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending || !!logoError}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
