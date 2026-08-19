"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Button, ErrorText, Field, Input, Label, Textarea } from "@/components/ui";
import { FormSelect } from "@/components/form-select";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import type { ProductFormState } from "./actions";

const initialState: ProductFormState = {};

type Brand = { id: string; name: string };

export function ProductForm({
  action,
  brands,
  defaultValues,
}: {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  brands: Brand[];
  defaultValues?: {
    brandId: string;
    name: string;
    description: string;
    differentials: string[];
    showcasePrice: number;
    showcaseCommissionPercent: number;
    flashPrice: number | null;
    flashCommissionPercent: number | null;
    requestBehavior: "REDIRECT_TIKTOK_SHOP" | "NOTIFY_TEAM";
    tiktokShopUrl: string | null;
    active: boolean;
    photoUrls: string[];
  };
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [behavior, setBehavior] = useState(defaultValues?.requestBehavior ?? "NOTIFY_TEAM");
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    setPhotoError(
      totalSize > MAX_UPLOAD_BYTES
        ? `As fotos selecionadas somam mais de ${MAX_UPLOAD_LABEL}. Escolha menos fotos ou arquivos menores.`
        : null,
    );
    // Preview local do arquivo escolhido antes mesmo de salvar — sem isso
    // o admin só vê "3 arquivos selecionados" no input nativo, sem
    // confirmação visual do que está prestes a subir.
    setPhotoPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((f) => URL.createObjectURL(f));
    });
  }

  return (
    <form action={formAction} className="max-w-xl">
      <Field>
        <Label htmlFor="brandId">Marca</Label>
        <FormSelect
          name="brandId"
          defaultValue={defaultValues?.brandId}
          required
          options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
        />
      </Field>

      <Field>
        <Label htmlFor="name">Nome do produto</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </Field>

      <Field>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description} required />
      </Field>

      <Field>
        <Label htmlFor="differentials">Diferenciais (um por linha)</Label>
        <Textarea
          id="differentials"
          name="differentials"
          rows={3}
          defaultValue={defaultValues?.differentials.join("\n")}
          placeholder={"Fórmula vegana\nSecagem rápida"}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="showcasePrice">Preço de vitrine (R$)</Label>
          <Input
            id="showcasePrice"
            name="showcasePrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={defaultValues?.showcasePrice}
            required
          />
        </Field>
        <Field>
          <Label htmlFor="showcaseCommissionPercent">Comissão (vitrine) %</Label>
          <Input
            id="showcaseCommissionPercent"
            name="showcaseCommissionPercent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            defaultValue={defaultValues?.showcaseCommissionPercent}
            required
          />
        </Field>
      </div>

      <Field>
        <Label>Oferta relâmpago (opcional)</Label>
        <p className="mb-2 text-xs text-mist">
          Preencha os dois campos para ativar a oferta na vitrine, ou deixe
          ambos em branco para desativar.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            aria-label="Preço de oferta relâmpago (R$)"
            name="flashPrice"
            type="number"
            step="0.01"
            min={0}
            placeholder="Preço (R$)"
            defaultValue={defaultValues?.flashPrice ?? ""}
          />
          <Input
            aria-label="Comissão (oferta relâmpago) %"
            name="flashCommissionPercent"
            type="number"
            step="0.01"
            min={0}
            max={100}
            placeholder="Comissão %"
            defaultValue={defaultValues?.flashCommissionPercent ?? ""}
          />
        </div>
      </Field>

      <Field>
        <Label>Ao clicar em &quot;Solicitar Amostra&quot;</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-paper">
            <input
              type="radio"
              name="requestBehavior"
              value="NOTIFY_TEAM"
              checked={behavior === "NOTIFY_TEAM"}
              onChange={() => setBehavior("NOTIFY_TEAM")}
            />
            Notifica equipe (convite direto) — entra na Fila de Solicitações
          </label>
          <label className="flex items-center gap-2 text-sm text-paper">
            <input
              type="radio"
              name="requestBehavior"
              value="REDIRECT_TIKTOK_SHOP"
              checked={behavior === "REDIRECT_TIKTOK_SHOP"}
              onChange={() => setBehavior("REDIRECT_TIKTOK_SHOP")}
            />
            Redireciona para o TikTok Shop
          </label>
        </div>
      </Field>

      {behavior === "REDIRECT_TIKTOK_SHOP" && (
        <Field>
          <Label htmlFor="tiktokShopUrl">URL da loja/produto no TikTok Shop</Label>
          <Input
            id="tiktokShopUrl"
            name="tiktokShopUrl"
            type="url"
            placeholder="https://shop.tiktok.com/..."
            defaultValue={defaultValues?.tiktokShopUrl ?? ""}
            required
          />
        </Field>
      )}

      {defaultValues && (
        <Field>
          <Label>Fotos atuais</Label>
          {defaultValues.photoUrls.length === 0 ? (
            <p className="text-sm text-mist">Nenhuma foto ainda.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {defaultValues.photoUrls.map((url) => (
                <label key={url} className="flex flex-col items-center gap-1 text-xs text-mist">
                  <Image
                    src={url}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded border border-graphite object-cover"
                  />
                  <span className="flex items-center gap-1">
                    <input type="checkbox" name="removePhotos" value={url} />
                    remover
                  </span>
                </label>
              ))}
            </div>
          )}
        </Field>
      )}

      <Field>
        <Label htmlFor="photos">{defaultValues ? "Adicionar fotos" : "Fotos"}</Label>
        <Input
          id="photos"
          name="photos"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif"
          multiple
          onChange={handlePhotosChange}
        />
        <ErrorText>{photoError}</ErrorText>
        {photoPreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-4 gap-3">
            {photoPreviews.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element -- preview local (blob:), next/image não serve URLs de objeto
              <img key={url} src={url} alt="" className="h-20 w-20 rounded border border-graphite object-cover" />
            ))}
          </div>
        )}
      </Field>

      {defaultValues && (
        <Field>
          <label className="flex items-center gap-2 text-sm text-paper">
            <input type="checkbox" name="active" defaultChecked={defaultValues.active} />
            Produto ativo (visível na vitrine)
          </label>
        </Field>
      )}

      <ErrorText>{state.error}</ErrorText>
      <Button type="submit" disabled={pending || !!photoError}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
