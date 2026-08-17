import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { getLimitStatusForPairs, limitKey } from "@/lib/sample-limits";
import { markSampleRequestDone, markSampleRequestPending } from "./actions";

type RequestRow = Awaited<ReturnType<typeof getRequests>>[number];

async function getRequests(showDone: boolean) {
  return prisma.sampleRequest.findMany({
    where: { behaviorAtRequest: "NOTIFY_TEAM", status: showDone ? "DONE" : "PENDING" },
    include: { creator: true, product: true, brand: true },
    orderBy: { createdAt: "asc" },
  });
}

export default async function FilaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const showDone = status === "done";

  const requests = await getRequests(showDone);

  const limitStatus = await getLimitStatusForPairs(
    requests.map((r) => ({
      creatorId: r.creatorId,
      brandId: r.brandId,
      brandDefaultLimit: r.brand.defaultSampleLimit,
    })),
  );

  const columns: ResponsiveTableColumn<RequestRow>[] = [
    {
      header: "Criadora",
      cell: (r) => (
        <>
          {r.creator.name ?? r.creator.tiktokHandle}
          <span className="block text-xs text-mist">@{r.creator.tiktokHandle}</span>
        </>
      ),
    },
    { header: "Produto", cell: (r) => r.product.name },
    { header: "Marca", cell: (r) => r.brand.name },
    {
      header: "Data do pedido",
      cell: (r) => <span className="font-mono text-xs">{r.createdAt.toLocaleDateString("pt-BR")}</span>,
    },
    {
      header: "Limite na marca",
      cell: (r) => {
        const s = limitStatus.get(limitKey(r.creatorId, r.brandId));
        if (!s) return null;
        return (
          <span
            className={
              s.reached
                ? "rounded-full bg-gold/15 px-2 py-1 text-xs font-medium text-gold"
                : "font-mono text-xs text-mist"
            }
          >
            {s.used}/{s.limit}
            {s.reached && " — limite atingido"}
          </span>
        );
      },
    },
    {
      header: "",
      cell: (r) =>
        showDone ? (
          <form action={markSampleRequestPending}>
            <input type="hidden" name="sampleRequestId" value={r.id} />
            <Button variant="secondary" type="submit">
              Reabrir
            </Button>
          </form>
        ) : (
          <form action={markSampleRequestDone}>
            <input type="hidden" name="sampleRequestId" value={r.id} />
            <Button type="submit">Marcar como atendido</Button>
          </form>
        ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-heading-md text-paper">Fila de Solicitações</h1>
      </div>
      <p className="mt-1 text-sm text-mist">
        Pedidos em produtos com comportamento &quot;notifica equipe&quot;. Envie o
        convite de colaboração no TikTok e marque como atendido.
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href="/admin/fila"
          className={
            !showDone
              ? "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-ink transition-colors duration-150"
              : "rounded-full border border-graphite px-3 py-1.5 text-sm text-mist transition-colors duration-150 hover:border-mist"
          }
        >
          Pendentes
        </Link>
        <Link
          href="/admin/fila?status=done"
          className={
            showDone
              ? "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-ink transition-colors duration-150"
              : "rounded-full border border-graphite px-3 py-1.5 text-sm text-mist transition-colors duration-150 hover:border-mist"
          }
        >
          Atendidos
        </Link>
      </div>

      {requests.length === 0 ? (
        <p className="mt-12 text-mist">{showDone ? "Nenhum pedido atendido ainda." : "Fila vazia."}</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={requests} rowKey={(r) => r.id} />
        </div>
      )}
    </div>
  );
}
