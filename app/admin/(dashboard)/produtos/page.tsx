import Link from "next/link";
import { Plus, Pencil, Copy } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { InlineEditActive, InlineEditBehavior, InlineEditPrice } from "@/components/inline-edit-product";
import { formatBRL } from "@/lib/format";
import { deleteProduct, duplicateProduct } from "./actions";

type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];

async function getProducts(brandId?: string) {
  return prisma.product.findMany({
    where: brandId ? { brandId } : {},
    include: { brand: true },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca: brandId } = await searchParams;

  const [products, brands] = await Promise.all([
    getProducts(brandId),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const columns: ResponsiveTableColumn<ProductRow>[] = [
    { header: "Nome", cell: (p) => p.name },
    { header: "Marca", cell: (p) => p.brand.name },
    {
      header: "Preço",
      cell: (p) => <InlineEditPrice productId={p.id} initialValue={Number(p.showcasePrice)} />,
    },
    {
      header: "Preço de oferta relâmpago",
      cell: (p) =>
        p.flashPrice != null ? (
          <span className="font-mono text-gold">{formatBRL(Number(p.flashPrice))}</span>
        ) : (
          <span className="text-mist/60">—</span>
        ),
    },
    {
      header: "Comportamento",
      cell: (p) => <InlineEditBehavior productId={p.id} initialValue={p.requestBehavior} />,
    },
    {
      header: "Status",
      cell: (p) => <InlineEditActive productId={p.id} initialValue={p.active} />,
    },
    {
      header: "",
      cell: (p) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/admin/produtos/${p.id}`}>
            <Button variant="secondary">
              <Pencil size={16} strokeWidth={1.75} />
              Editar
            </Button>
          </Link>
          <form action={duplicateProduct}>
            <input type="hidden" name="productId" value={p.id} />
            <Button type="submit" variant="secondary">
              <Copy size={16} strokeWidth={1.75} />
              Duplicar
            </Button>
          </form>
          <form action={deleteProduct}>
            <input type="hidden" name="productId" value={p.id} />
            <ConfirmSubmitButton confirmMessage={`Excluir o produto "${p.name}"?`}>
              Excluir
            </ConfirmSubmitButton>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-heading-md text-paper">Produtos</h1>
        <Link href="/admin/produtos/novo">
          <Button>
            <Plus size={18} strokeWidth={1.75} />
            Novo produto
          </Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterLink label="Todas as marcas" active={!brandId} href="/admin/produtos" />
        {brands.map((brand) => (
          <FilterLink
            key={brand.id}
            label={brand.name}
            active={brandId === brand.id}
            href={`/admin/produtos?marca=${brand.id}`}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-mist">Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={products} rowKey={(p) => p.id} />
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
          ? "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-ink transition-colors duration-150"
          : "rounded-full border border-graphite px-3 py-1.5 text-sm text-mist transition-colors duration-150 hover:border-mist"
      }
    >
      {label}
    </Link>
  );
}
