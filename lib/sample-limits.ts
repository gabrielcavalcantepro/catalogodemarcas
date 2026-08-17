import "server-only";
import { prisma } from "@/lib/db";

/**
 * Limite de amostras é por marca (todos os produtos), com um valor padrão
 * na marca e overrides manuais por criadora (spec §5.4/§6.2). Só as
 * solicitações com comportamento NOTIFY_TEAM contam — é a única forma que
 * a equipe tem visibilidade/controle real (§6.2, limitação aceita).
 */
export async function getLimitStatusForPairs(
  pairs: Array<{ creatorId: string; brandId: string; brandDefaultLimit: number }>,
) {
  const uniquePairs = new Map(
    pairs.map((p) => [`${p.creatorId}:${p.brandId}`, p]),
  );
  const pairList = [...uniquePairs.values()];

  if (pairList.length === 0) {
    return new Map<string, { used: number; limit: number; reached: boolean }>();
  }

  const [overrides, counts] = await Promise.all([
    prisma.creatorBrandLimit.findMany({
      where: { OR: pairList.map((p) => ({ creatorId: p.creatorId, brandId: p.brandId })) },
    }),
    prisma.sampleRequest.groupBy({
      by: ["creatorId", "brandId"],
      where: {
        behaviorAtRequest: "NOTIFY_TEAM",
        OR: pairList.map((p) => ({ creatorId: p.creatorId, brandId: p.brandId })),
      },
      _count: { _all: true },
    }),
  ]);

  const overrideMap = new Map(overrides.map((o) => [`${o.creatorId}:${o.brandId}`, o.limit]));
  const countMap = new Map(counts.map((c) => [`${c.creatorId}:${c.brandId}`, c._count._all]));

  const result = new Map<string, { used: number; limit: number; reached: boolean }>();
  for (const pair of pairList) {
    const key = `${pair.creatorId}:${pair.brandId}`;
    const limit = overrideMap.get(key) ?? pair.brandDefaultLimit;
    const used = countMap.get(key) ?? 0;
    result.set(key, { used, limit, reached: used >= limit });
  }
  return result;
}

export function limitKey(creatorId: string, brandId: string) {
  return `${creatorId}:${brandId}`;
}
