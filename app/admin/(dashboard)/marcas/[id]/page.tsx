import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BrandForm } from "../brand-form";
import { updateBrand } from "../actions";

export default async function EditarMarcaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) notFound();

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Editar marca</h1>
      <div className="mt-6">
        <BrandForm
          action={updateBrand.bind(null, brand.id)}
          defaultValues={{
            name: brand.name,
            defaultSampleLimit: brand.defaultSampleLimit,
            logoUrl: brand.logoUrl,
          }}
        />
      </div>
    </div>
  );
}
