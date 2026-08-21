import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { CreatorPostRow } from "./creator-post-row";
import { NewSampleShortcut } from "./new-sample-shortcut";

export default async function DivulgacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;

  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  const selectedBrandId = marca ?? brands[0]?.id;

  if (!selectedBrandId) {
    return (
      <div>
        <h1 className="font-display text-heading-md text-paper">Divulgações</h1>
        <p className="mt-4 text-mist">Cadastre uma marca antes de registrar divulgações.</p>
      </div>
    );
  }

  const [deliveries, posts, creators, products, byCreator] = await Promise.all([
    prisma.sampleDelivery.findMany({
      where: { brandId: selectedBrandId },
      include: { creator: true, product: true },
      orderBy: { creator: { tiktokHandle: "asc" } },
    }),
    prisma.contentPost.findMany({
      where: { brandId: selectedBrandId },
      include: { product: true },
      orderBy: { postDate: "desc" },
    }),
    prisma.creator.findMany({ orderBy: { tiktokHandle: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, brandId: true } }),
    prisma.contentPost.groupBy({ by: ["creatorId"], _count: { _all: true } }),
  ]);

  const creatorById = new Map(creators.map((c) => [c.id, c]));
  const creatorCounts = byCreator
    .map((row) => ({ creator: creatorById.get(row.creatorId), count: row._count._all }))
    .filter((r): r is { creator: NonNullable<typeof r.creator>; count: number } => !!r.creator)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Fonte de verdade de "quem tem amostra dessa marca" é SampleDelivery —
  // só entram na lista criadoras com pelo menos um registro lá, mesmo sem
  // nenhum ContentPost ainda (é justamente o caso que antes ficava invisível).
  const rows = new Map<
    string,
    { creator: (typeof deliveries)[number]["creator"]; deliveries: typeof deliveries; posts: typeof posts }
  >();
  for (const d of deliveries) {
    if (!rows.has(d.creatorId)) rows.set(d.creatorId, { creator: d.creator, deliveries: [], posts: [] });
    rows.get(d.creatorId)!.deliveries.push(d);
  }
  for (const p of posts) {
    rows.get(p.creatorId)?.posts.push(p);
  }

  const creatorRows = [...rows.values()];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-heading-md text-paper">Divulgações</h1>
        <NewSampleShortcut creators={creators} brands={brands} products={products} brandId={selectedBrandId} />
      </div>
      <p className="mt-1 text-sm text-mist">
        Criadoras com amostra registrada de cada marca — inclusive quem ainda não postou nada.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/admin/divulgacoes?marca=${b.id}`}
            className={
              b.id === selectedBrandId
                ? "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-ink transition-colors duration-150"
                : "rounded-full border border-graphite px-3 py-1.5 text-sm text-mist transition-colors duration-150 hover:border-mist"
            }
          >
            {b.name}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        {creatorRows.length === 0 ? (
          <p className="text-mist">Nenhuma amostra registrada para essa marca ainda.</p>
        ) : (
          <div className="space-y-3">
            {creatorRows.map(({ creator, deliveries, posts }) => (
              <CreatorPostRow
                key={creator.id}
                creator={creator}
                brandId={selectedBrandId}
                deliveries={deliveries}
                posts={posts}
              />
            ))}
          </div>
        )}

        <Card className="h-fit lg:sticky lg:top-4">
          <h2 className="mb-3 text-sm font-semibold text-paper">Ranking geral por criadora</h2>
          {creatorCounts.length === 0 ? (
            <p className="text-sm text-mist">Nenhuma divulgação registrada ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {creatorCounts.map(({ creator, count }) => (
                <li key={creator.id} className="flex justify-between text-paper">
                  <span className="truncate">{creator.name ?? creator.tiktokHandle}</span>
                  <span className="ml-2 shrink-0 font-mono text-gold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
