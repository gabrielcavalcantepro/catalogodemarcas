import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { updateProduct } from "../actions";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-heading-md text-paper">Editar produto</h1>
      <div className="mt-6">
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          brands={brands}
          defaultValues={{
            brandId: product.brandId,
            name: product.name,
            description: product.description,
            differentials: product.differentials,
            showcasePrice: Number(product.showcasePrice),
            showcaseCommissionPercent: Number(product.showcaseCommissionPercent),
            flashPrice: product.flashPrice != null ? Number(product.flashPrice) : null,
            flashCommissionPercent:
              product.flashCommissionPercent != null ? Number(product.flashCommissionPercent) : null,
            requestBehavior: product.requestBehavior,
            tiktokShopUrl: product.tiktokShopUrl,
            active: product.active,
            photoUrls: product.photoUrls,
          }}
        />
      </div>
    </div>
  );
}
