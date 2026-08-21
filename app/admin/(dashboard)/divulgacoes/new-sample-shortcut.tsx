"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { SampleDeliveryForm } from "@/components/sample-delivery-form";
import type { CreatorOption } from "@/components/creator-combobox";

type Brand = { id: string; name: string };
type Product = { id: string; name: string; brandId: string };

// Reusa o mesmo formulário de cadastro de amostra de /admin/amostras, com a
// marca da tela atual já fixa — não reimplementa nada.
export function NewSampleShortcut({
  creators,
  brands,
  products,
  brandId,
}: {
  creators: CreatorOption[];
  brands: Brand[];
  products: Product[];
  brandId: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Plus size={18} strokeWidth={1.75} />
        Nova amostra
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova amostra">
        <SampleDeliveryForm
          creators={creators}
          brands={brands}
          products={products}
          fixedBrandId={brandId}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
