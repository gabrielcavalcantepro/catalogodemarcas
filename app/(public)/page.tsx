import { prisma } from "@/lib/db";
import { getCreatorId } from "@/lib/auth/creator";
import { getLimitStatusForPairs, limitKey } from "@/lib/sample-limits";
import { LoginForm } from "@/components/login-form";
import { ProductCard } from "@/components/product-card";
import { CatalogShell } from "@/components/catalog-shell";

export default async function VitrinePage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const creatorId = await getCreatorId();

  if (!creatorId) {
    return <LoginForm />;
  }

  const { marca: brandId } = await searchParams;

  const [brands, products, myRequests] = await Promise.all([
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { active: true, ...(brandId ? { brandId } : {}) },
      include: { brand: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sampleRequest.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lastRequestByProduct = new Map<string, Date>();
  for (const req of myRequests) {
    if (!lastRequestByProduct.has(req.productId)) {
      lastRequestByProduct.set(req.productId, req.createdAt);
    }
  }

  const limitStatus = await getLimitStatusForPairs(
    brands.map((b) => ({ creatorId, brandId: b.id, brandDefaultLimit: b.defaultSampleLimit })),
  );

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Catálogo</h1>
      <p className="mt-1 text-sm text-mist">
        Marcas parceiras e produtos disponíveis para amostra.
      </p>

      <CatalogShell brands={brands} activeBrandId={brandId}>
        {products.length === 0 ? (
          <p className="mt-12 text-center text-mist">Nenhum produto disponível ainda.</p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                lastRequestedAt={lastRequestByProduct.get(product.id) ?? null}
                limitStatus={limitStatus.get(limitKey(creatorId, product.brandId)) ?? null}
                index={index}
              />
            ))}
          </div>
        )}
      </CatalogShell>
    </div>
  );
}
