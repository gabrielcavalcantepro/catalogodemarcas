"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button, ErrorText, Field, Input, Label } from "@/components/ui";
import { FormSelect } from "@/components/form-select";
import { setCreatorBrandLimit, type LimitFormState } from "./actions";

const initialState: LimitFormState = {};

export function SetLimitForm({
  creators,
  brands,
  defaultCreatorId,
  defaultBrandId,
  defaultLimit,
}: {
  creators: { id: string; name: string | null; tiktokHandle: string }[];
  brands: { id: string; name: string }[];
  defaultCreatorId?: string;
  defaultBrandId?: string;
  defaultLimit?: number;
}) {
  const [state, formAction, pending] = useActionState(setCreatorBrandLimit, initialState);

  useEffect(() => {
    if (state.success) toast.success("Limite atualizado.");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field>
        <Label htmlFor="creatorId">Criadora</Label>
        <div className="min-w-48">
          <FormSelect
            name="creatorId"
            defaultValue={defaultCreatorId}
            required
            options={creators.map((c) => ({
              value: c.id,
              label: `${c.name ?? "(aguardando registro)"} (@${c.tiktokHandle})`,
            }))}
          />
        </div>
      </Field>
      <Field>
        <Label htmlFor="brandId">Marca</Label>
        <div className="min-w-40">
          <FormSelect
            name="brandId"
            defaultValue={defaultBrandId}
            required
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
        </div>
      </Field>
      <Field>
        <Label htmlFor="limit">Novo limite</Label>
        <Input
          id="limit"
          name="limit"
          type="number"
          min={0}
          defaultValue={defaultLimit}
          required
          className="w-24"
        />
      </Field>
      <Button type="submit" disabled={pending} className="mb-4">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
      <div className="w-full">
        <ErrorText>{state.error}</ErrorText>
      </div>
    </form>
  );
}
