import { prisma } from "@/lib/db";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default async function NovoProdutoPage() {
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Novo produto</h1>
      {brands.length === 0 ? (
        <p className="mt-6 text-mist">
          Cadastre uma marca antes de criar um produto.
        </p>
      ) : (
        <div className="mt-6">
          <ProductForm action={createProduct} brands={brands} />
        </div>
      )}
    </div>
  );
}
