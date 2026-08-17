import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { ContentPostForm } from "./content-post-form";
import { deleteContentPost } from "./actions";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Vídeo",
  LIVE: "Live",
  STORY: "Story",
};

type PostRow = Awaited<ReturnType<typeof getPosts>>[number];

async function getPosts() {
  return prisma.contentPost.findMany({
    include: { creator: true, brand: true, product: true },
    orderBy: { postDate: "desc" },
    take: 100,
  });
}

export default async function DivulgacoesPage() {
  const [posts, creators, brands, products, byCreator, byBrand] = await Promise.all([
    getPosts(),
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, brandId: true } }),
    prisma.contentPost.groupBy({ by: ["creatorId"], _count: { _all: true } }),
    prisma.contentPost.groupBy({ by: ["brandId"], _count: { _all: true } }),
  ]);

  const creatorById = new Map(creators.map((c) => [c.id, c]));
  const brandById = new Map(brands.map((b) => [b.id, b]));

  const creatorCounts = byCreator
    .map((row) => ({ creator: creatorById.get(row.creatorId), count: row._count._all }))
    .filter((r): r is { creator: NonNullable<typeof r.creator>; count: number } => !!r.creator)
    .sort((a, b) => b.count - a.count);

  const brandCounts = byBrand
    .map((row) => ({ brand: brandById.get(row.brandId), count: row._count._all }))
    .filter((r): r is { brand: NonNullable<typeof r.brand>; count: number } => !!r.brand)
    .sort((a, b) => b.count - a.count);

  const columns: ResponsiveTableColumn<PostRow>[] = [
    { header: "Criadora", cell: (p) => p.creator.name ?? p.creator.tiktokHandle },
    { header: "Marca", cell: (p) => p.brand.name },
    { header: "Produto", cell: (p) => p.product?.name ?? "—" },
    { header: "Tipo", cell: (p) => CONTENT_TYPE_LABELS[p.contentType] },
    {
      header: "Data",
      cell: (p) => (
        <span className="font-mono text-xs">
          {p.postDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
        </span>
      ),
    },
    {
      header: "Link",
      cell: (p) =>
        p.link ? (
          <a
            href={p.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            Abrir
          </a>
        ) : (
          <span className="text-mist/50">—</span>
        ),
    },
    {
      header: "",
      cell: (p) => (
        <form action={deleteContentPost}>
          <input type="hidden" name="contentPostId" value={p.id} />
          <ConfirmSubmitButton confirmMessage="Excluir esta divulgação?">Excluir</ConfirmSubmitButton>
        </form>
      ),
    },
  ];

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Divulgações</h1>
      <p className="mt-1 text-sm text-mist">
        Registro de conteúdo publicado por cada criadora (substitui a planilha de UGC).
      </p>

      <Card className="mt-6">
        <ContentPostForm creators={creators} brands={brands} products={products} />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-paper">Divulgações por criadora</h2>
          {creatorCounts.length === 0 ? (
            <p className="text-sm text-mist">Nenhuma divulgação registrada ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {creatorCounts.map(({ creator, count }) => (
                <li key={creator.id} className="flex justify-between text-paper">
                  <span>{creator.name ?? creator.tiktokHandle}</span>
                  <span className="font-mono text-gold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-paper">Divulgações por marca</h2>
          {brandCounts.length === 0 ? (
            <p className="text-sm text-mist">Nenhuma divulgação registrada ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {brandCounts.map(({ brand, count }) => (
                <li key={brand.id} className="flex justify-between text-paper">
                  <span>{brand.name}</span>
                  <span className="font-mono text-gold">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mt-8 mb-3 font-display text-heading-sm text-paper">Histórico</h2>
      {posts.length === 0 ? (
        <p className="text-mist">Nenhuma divulgação registrada ainda.</p>
      ) : (
        <ResponsiveTable columns={columns} rows={posts} rowKey={(p) => p.id} />
      )}
    </div>
  );
}
