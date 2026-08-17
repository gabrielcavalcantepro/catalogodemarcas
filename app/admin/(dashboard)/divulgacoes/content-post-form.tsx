"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import { FormSelect } from "@/components/form-select";
import { FormDateField } from "@/components/form-date-field";
import { createContentPost, type ContentPostFormState } from "./actions";

const initialState: ContentPostFormState = {};

type Creator = { id: string; name: string | null; tiktokHandle: string };
type Brand = { id: string; name: string };
type Product = { id: string; name: string; brandId: string };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Vídeo",
  LIVE: "Live",
  STORY: "Story",
};

export function ContentPostForm({
  creators,
  brands,
  products,
}: {
  creators: Creator[];
  brands: Brand[];
  products: Product[];
}) {
  const [state, formAction, pending] = useActionState(createContentPost, initialState);
  const [brandId, setBrandId] = useState("");

  useEffect(() => {
    if (state.success) toast.success("Divulgação registrada.");
  }, [state]);

  const productsForBrand = useMemo(
    () => products.filter((p) => p.brandId === brandId),
    [products, brandId],
  );

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
      <Field>
        <Label htmlFor="creatorId">Criadora</Label>
        <FormSelect
          name="creatorId"
          required
          options={creators.map((c) => ({
            value: c.id,
            label: `${c.name ?? "(aguardando registro)"} (@${c.tiktokHandle})`,
          }))}
        />
      </Field>
      <Field>
        <Label htmlFor="brandId">Marca</Label>
        <FormSelect
          name="brandId"
          required
          value={brandId}
          onValueChange={setBrandId}
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
        />
      </Field>
      <Field>
        <Label htmlFor="productId">Produto (opcional)</Label>
        <FormSelect
          name="productId"
          placeholder="Nenhum específico"
          disabled={!brandId}
          options={productsForBrand.map((p) => ({ value: p.id, label: p.name }))}
        />
      </Field>
      <Field>
        <Label htmlFor="contentType">Tipo</Label>
        <FormSelect
          name="contentType"
          required
          defaultValue="VIDEO"
          options={Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </Field>
      <Field>
        <Label htmlFor="postDate">Data</Label>
        <FormDateField name="postDate" />
      </Field>
      <Field>
        <Label htmlFor="link">Link (opcional)</Label>
        <Input id="link" name="link" type="url" placeholder="https://..." />
      </Field>
      <div className="lg:col-span-6">
        <ErrorText>{state.error}</ErrorText>
        <Button type="submit" disabled={pending}>
          <Plus size={18} strokeWidth={1.75} />
          {pending ? "Salvando..." : "Registrar divulgação"}
        </Button>
      </div>
    </form>
  );
}
