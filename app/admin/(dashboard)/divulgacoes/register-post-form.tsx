"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import { FormSelect } from "@/components/form-select";
import { FormDateField } from "@/components/form-date-field";
import { createContentPost, type ContentPostFormState } from "./actions";

const initialState: ContentPostFormState = {};

const CONTENT_TYPE_OPTIONS = [
  { value: "VIDEO", label: "Vídeo" },
  { value: "LIVE", label: "Live" },
];

// Criadora e marca já vêm fixas (linha da lista em page.tsx) — só pede
// Produto (restrito aos recebidos por ela dessa marca, passado via
// receivedProducts), Tipo, Data e Link (Live não pede link: não existe
// conteúdo gravado pra linkar).
export function RegisterPostForm({
  creatorId,
  brandId,
  receivedProducts,
  onSuccess,
}: {
  creatorId: string;
  brandId: string;
  receivedProducts: { id: string; name: string }[];
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createContentPost, initialState);
  const [contentType, setContentType] = useState("VIDEO");

  useEffect(() => {
    if (state.success) {
      toast.success("Divulgação registrada.");
      onSuccess?.();
    }
  }, [state, onSuccess]);

  if (receivedProducts.length === 0) {
    return <p className="text-sm text-mist">Essa criadora ainda não tem produto recebido dessa marca.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="creatorId" value={creatorId} />
      <input type="hidden" name="brandId" value={brandId} />

      <Field>
        <Label htmlFor="productId">Produto</Label>
        <FormSelect
          name="productId"
          required
          options={receivedProducts.map((p) => ({ value: p.id, label: p.name }))}
        />
      </Field>

      <Field>
        <Label htmlFor="contentType">Tipo</Label>
        <FormSelect
          name="contentType"
          required
          value={contentType}
          onValueChange={setContentType}
          options={CONTENT_TYPE_OPTIONS}
        />
      </Field>

      <Field>
        <Label htmlFor="postDate">Data</Label>
        <FormDateField name="postDate" />
      </Field>

      {contentType === "VIDEO" && (
        <Field>
          <Label htmlFor="link">Link (opcional)</Label>
          <Input id="link" name="link" type="url" placeholder="https://..." />
        </Field>
      )}

      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Registrar divulgação"}
      </Button>
    </form>
  );
}
