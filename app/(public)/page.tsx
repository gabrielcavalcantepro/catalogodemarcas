import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCreatorId } from "@/lib/auth/creator";
import { LoginForm } from "@/components/login-form";
import { ProductCard } from "@/components/product-card";

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

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Catálogo</h1>
      <p className="mt-1 text-sm text-mist">
        Marcas parceiras e produtos disponíveis para amostra.
      </p>

      <div className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-ink px-4 py-2 sm:-mx-6 sm:px-6">
        <FilterLink label="Todas as marcas" active={!brandId} href="/" />
        {brands.map((brand) => (
          <FilterLink
            key={brand.id}
            label={brand.name}
            active={brandId === brand.id}
            href={`/?marca=${brand.id}`}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-center text-mist">Nenhum produto disponível ainda.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              lastRequestedAt={lastRequestByProduct.get(product.id) ?? null}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex h-8 shrink-0 items-center rounded-full bg-gold px-3 text-sm font-bold whitespace-nowrap text-ink transition-colors duration-150"
          : "inline-flex h-8 shrink-0 items-center rounded-full bg-charcoal px-3 text-sm whitespace-nowrap text-mist transition-colors duration-150 hover:text-paper"
      }
    >
      {label}
    </Link>
  );
}
