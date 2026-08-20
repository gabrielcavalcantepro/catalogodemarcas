import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { deleteBrand } from "./actions";

type BrandRow = Awaited<ReturnType<typeof getBrands>>[number];

async function getBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export default async function MarcasPage() {
  const brands = await getBrands();

  const columns: ResponsiveTableColumn<BrandRow>[] = [
    { header: "Nome", cell: (b) => b.name },
    { header: "Limite padrão", cell: (b) => b.defaultSampleLimit },
    { header: "Produtos", cell: (b) => b._count.products },
    {
      header: "",
      cell: (b) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/admin/marcas/${b.id}`}>
            <Button variant="secondary">
              <Pencil size={16} strokeWidth={1.75} />
              Editar
            </Button>
          </Link>
          <form action={deleteBrand}>
            <input type="hidden" name="brandId" value={b.id} />
            <ConfirmSubmitButton
              confirmMessage={`Excluir a marca "${b.name}"? Isso remove também os produtos e solicitações relacionados.`}
            >
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
        <h1 className="font-display text-heading-md text-paper">Marcas</h1>
        <Link href="/admin/marcas/nova">
          <Button>
            <Plus size={18} strokeWidth={1.75} />
            Nova marca
          </Button>
        </Link>
      </div>

      {brands.length === 0 ? (
        <p className="mt-12 text-mist">Nenhuma marca cadastrada ainda.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={brands} rowKey={(b) => b.id} />
        </div>
      )}
    </div>
  );
}
