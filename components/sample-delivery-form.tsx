"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, ErrorText, Field, Label } from "@/components/ui";
import { FormSelect } from "@/components/form-select";
import { CreatorCombobox, type CreatorOption } from "@/components/creator-combobox";
import { createSampleDelivery, type SampleDeliveryFormState } from "@/app/admin/(dashboard)/amostras/actions";

const initialState: SampleDeliveryFormState = {};

type Brand = { id: string; name: string };
type Product = { id: string; name: string; brandId: string };

// Reaproveitado tanto em /admin/amostras quanto no modal "+ nova amostra"
// de Divulgações (fixedBrandId fica preenchido nesse segundo caso, e o
// campo Marca vira só leitura).
export function SampleDeliveryForm({
  creators,
  brands,
  products,
  fixedBrandId,
  onSuccess,
}: {
  creators: CreatorOption[];
  brands: Brand[];
  products: Product[];
  fixedBrandId?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction, pending] = useActionState(createSampleDelivery, initialState);
  const [brandId, setBrandId] = useState(fixedBrandId ?? "");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (state.success) {
      toast.success("Amostra registrada.");
      setSelectedProductIds([]);
      onSuccess?.();
    }
  }, [state, onSuccess]);

  const productsForBrand = useMemo(
    () => products.filter((p) => p.brandId === brandId),
    [products, brandId],
  );

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  return (
    <form action={formAction} className="space-y-3">
      <Field>
        <Label htmlFor="creatorId">Criadora</Label>
        <CreatorCombobox name="creatorId" creators={creators} required />
      </Field>

      <Field>
        <Label htmlFor="brandId">Marca</Label>
        {fixedBrandId ? (
          <>
            <input type="hidden" name="brandId" value={fixedBrandId} />
            <p className="rounded-[10px] bg-graphite px-3 py-2.5 text-sm text-paper">
              {brands.find((b) => b.id === fixedBrandId)?.name}
            </p>
          </>
        ) : (
          <FormSelect
            name="brandId"
            required
            value={brandId}
            onValueChange={(v) => {
              setBrandId(v);
              setSelectedProductIds([]);
            }}
            options={brands.map((b) => ({ value: b.id, label: b.name }))}
          />
        )}
      </Field>

      <Field>
        <Label>Produtos</Label>
        {!brandId ? (
          <p className="text-sm text-mist">Selecione uma marca primeiro.</p>
        ) : productsForBrand.length === 0 ? (
          <p className="text-sm text-mist">Essa marca não tem produtos cadastrados.</p>
        ) : (
          <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-[10px] border border-graphite p-2">
            {productsForBrand.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-paper transition-colors duration-150 hover:bg-ink"
              >
                <input
                  type="checkbox"
                  name="productIds"
                  value={p.id}
                  checked={selectedProductIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        )}
      </Field>

      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending || selectedProductIds.length === 0}>
        {pending ? "Salvando..." : "Registrar amostra"}
      </Button>
    </form>
  );
}
