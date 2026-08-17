import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCreatorId } from "@/lib/auth/creator";

export default async function MinhasSolicitacoesPage() {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    redirect("/");
  }

  const requests = await prisma.sampleRequest.findMany({
    where: { creatorId },
    include: { product: true, brand: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-[640px]">
      <h1 className="font-display text-heading-md text-paper">Minhas Solicitações</h1>
      <p className="mt-1 text-sm text-mist">
        Produtos que você já solicitou, para não pedir o mesmo duas vezes.
      </p>

      {requests.length === 0 ? (
        <p className="mt-12 text-center text-mist">Você ainda não solicitou nenhuma amostra.</p>
      ) : (
        <ul className="mt-6 divide-y divide-graphite">
          {requests.map((req) => (
            <li key={req.id} className="flex items-center justify-between gap-3 py-3">
              <span className="font-medium text-paper">{req.product.name}</span>
              <span className="text-right text-caption text-mist">
                {req.brand.name}
                <span className="ml-2 font-mono">
                  {req.createdAt.toLocaleDateString("pt-BR")}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
