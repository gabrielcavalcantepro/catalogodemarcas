"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { CreatorOption } from "@/components/creator-combobox";
import { SampleDeliveryForm } from "@/components/sample-delivery-form";

type Brand = { id: string; name: string };
type Product = { id: string; name: string; brandId: string };

export function NewSampleDeliveryButton({
  creators,
  brands,
  products,
}: {
  creators: CreatorOption[];
  brands: Brand[];
  products: Product[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus size={18} strokeWidth={1.75} />
        Nova amostra
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova amostra">
        <SampleDeliveryForm
          creators={creators}
          brands={brands}
          products={products}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
