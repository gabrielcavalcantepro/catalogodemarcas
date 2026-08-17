import Link from "next/link";
import { prisma } from "@/lib/db";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { SetLimitForm } from "./set-limit-form";

export default async function LimitesPage({
  searchParams,
}: {
  searchParams: Promise<{ creatorId?: string; brandId?: string }>;
}) {
  const { creatorId: editCreatorId, brandId: editBrandId } = await searchParams;

  const [activity, overrides, creators, brands] = await Promise.all([
    prisma.sampleRequest.groupBy({
      by: ["creatorId", "brandId"],
      where: { behaviorAtRequest: "NOTIFY_TEAM" },
      _count: { _all: true },
    }),
    prisma.creatorBrandLimit.findMany(),
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  const creatorById = new Map(creators.map((c) => [c.id, c]));
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const overrideByKey = new Map(overrides.map((o) => [`${o.creatorId}:${o.brandId}`, o.limit]));
  const usedByKey = new Map(activity.map((a) => [`${a.creatorId}:${a.brandId}`, a._count._all]));

  const pairKeys = new Set<string>([
    ...activity.map((a) => `${a.creatorId}:${a.brandId}`),
    ...overrides.map((o) => `${o.creatorId}:${o.brandId}`),
  ]);

  const rows = [...pairKeys]
    .map((key) => {
      const [creatorId, brandId] = key.split(":");
      const creator = creatorById.get(creatorId);
      const brand = brandById.get(brandId);
      if (!creator || !brand) return null;
      const override = overrideByKey.get(key);
      const limit = override ?? brand.defaultSampleLimit;
      const used = usedByKey.get(key) ?? 0;
      return { creator, brand, limit, used, isOverride: override !== undefined, reached: used >= limit };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) =>
      (a.creator.name ?? a.creator.tiktokHandle).localeCompare(
        b.creator.name ?? b.creator.tiktokHandle,
      ),
    );

  const editDefaultLimit =
    editCreatorId && editBrandId
      ? (overrideByKey.get(`${editCreatorId}:${editBrandId}`) ??
        brandById.get(editBrandId)?.defaultSampleLimit)
      : undefined;

  const columns: ResponsiveTableColumn<(typeof rows)[number]>[] = [
    {
      header: "Criadora",
      cell: (r) => (
        <>
          {r.creator.name ?? r.creator.tiktokHandle}
          <span className="block text-xs text-mist">@{r.creator.tiktokHandle}</span>
        </>
      ),
    },
    { header: "Marca", cell: (r) => r.brand.name },
    {
      header: "Usado / Limite",
      cell: (r) => (
        <span className={r.reached ? "font-mono text-gold" : "font-mono text-paper"}>
          {r.used}/{r.limit}
        </span>
      ),
    },
    {
      header: "Origem",
      cell: (r) => (
        <span className="text-xs text-mist">
          {r.isOverride ? "Ajustado manualmente" : "Padrão da marca"}
        </span>
      ),
    },
    {
      header: "",
      cell: (r) => (
        <Link
          href={`/admin/limites?creatorId=${r.creator.id}&brandId=${r.brand.id}`}
          className="text-sm text-gold hover:underline"
        >
          Editar
        </Link>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Limites por Criadora</h1>
      <p className="mt-1 text-sm text-mist">
        Limite de amostras por marca (todos os produtos), com valor padrão na
        marca e ajuste manual por criadora conforme desempenho de vendas.
      </p>

      <div className="mt-6 rounded-[20px] bg-charcoal p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
        <SetLimitForm
          creators={creators}
          brands={brands}
          defaultCreatorId={editCreatorId}
          defaultBrandId={editBrandId}
          defaultLimit={editDefaultLimit}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mt-12 text-mist">Nenhuma criadora com solicitações ou limite ajustado ainda.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={rows} rowKey={(r) => `${r.creator.id}:${r.brand.id}`} />
        </div>
      )}
    </div>
  );
}
