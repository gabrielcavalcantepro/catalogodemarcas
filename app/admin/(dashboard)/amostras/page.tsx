import Link from "next/link";
import { prisma } from "@/lib/db";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { InlineDeliveryStatus } from "@/components/inline-delivery-status";
import { NewSampleDeliveryButton } from "./new-sample-delivery-button";
import { deleteSampleDelivery } from "./actions";

type DeliveryRow = Awaited<ReturnType<typeof getDeliveries>>[number];

async function getDeliveries(brandId?: string, creatorId?: string, status?: string) {
  return prisma.sampleDelivery.findMany({
    where: {
      ...(brandId ? { brandId } : {}),
      ...(creatorId ? { creatorId } : {}),
      ...(status === "in_transit" ? { status: "IN_TRANSIT" } : {}),
      ...(status === "received" ? { status: "RECEIVED" } : {}),
    },
    include: { creator: true, brand: true, product: true },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AmostrasPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string; criadora?: string; status?: string }>;
}) {
  const { marca: brandId, criadora: creatorId, status } = await searchParams;

  const [deliveries, brands, creators, products] = await Promise.all([
    getDeliveries(brandId, creatorId, status),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.creator.findMany({ orderBy: { tiktokHandle: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, brandId: true } }),
  ]);

  const columns: ResponsiveTableColumn<DeliveryRow>[] = [
    {
      header: "Criadora",
      cell: (d) => (
        <>
          {d.creator.name ?? d.creator.tiktokHandle}
          <span className="block text-xs text-mist">@{d.creator.tiktokHandle}</span>
        </>
      ),
    },
    { header: "Marca", cell: (d) => d.brand.name },
    { header: "Produto", cell: (d) => d.product.name },
    {
      header: "Status",
      cell: (d) => <InlineDeliveryStatus deliveryId={d.id} initialValue={d.status} />,
    },
    {
      header: "Registrada em",
      cell: (d) => <span className="font-mono text-xs">{d.createdAt.toLocaleDateString("pt-BR")}</span>,
    },
    {
      header: "",
      cell: (d) => (
        <form action={deleteSampleDelivery}>
          <input type="hidden" name="sampleDeliveryId" value={d.id} />
          <ConfirmSubmitButton
            className="px-3"
            aria-label="Excluir"
            confirmMessage={`Excluir esse registro de amostra ("${d.product.name}" para @${d.creator.tiktokHandle})?`}
          />
        </form>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-heading-md text-paper">Gerenciamento de Amostras</h1>
        <NewSampleDeliveryButton creators={creators} brands={brands} products={products} />
      </div>
      <p className="mt-1 text-sm text-mist">
        Controle manual de quem está com qual produto em mãos — a equipe atualiza aqui
        conforme acompanha o envio no Seller Center do TikTok.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <FilterLink label="Todas as marcas" active={!brandId} paramKey="marca" paramValue={undefined} current={{ criadora: creatorId, status }} />
        {brands.map((b) => (
          <FilterLink key={b.id} label={b.name} active={brandId === b.id} paramKey="marca" paramValue={b.id} current={{ criadora: creatorId, status }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <FilterLink label="Todos os status" active={!status} paramKey="status" paramValue={undefined} current={{ marca: brandId, criadora: creatorId }} />
        <FilterLink label="Em trânsito" active={status === "in_transit"} paramKey="status" paramValue="in_transit" current={{ marca: brandId, criadora: creatorId }} />
        <FilterLink label="Recebida" active={status === "received"} paramKey="status" paramValue="received" current={{ marca: brandId, criadora: creatorId }} />
      </div>

      {deliveries.length === 0 ? (
        <p className="mt-12 text-mist">Nenhuma amostra registrada ainda.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={deliveries} rowKey={(d) => d.id} />
        </div>
      )}
    </div>
  );
}

function FilterLink({
  label,
  active,
  paramKey,
  paramValue,
  current,
}: {
  label: string;
  active: boolean;
  paramKey: string;
  paramValue: string | undefined;
  current: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(current)) {
    if (value) params.set(key, value);
  }
  if (paramValue) params.set(paramKey, paramValue);
  const query = params.toString();

  return (
    <Link
      href={`/admin/amostras${query ? `?${query}` : ""}`}
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
