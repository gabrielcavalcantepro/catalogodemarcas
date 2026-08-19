import "server-only";
import { prisma } from "@/lib/db";

// Linha única (id fixo = 1, ver Settings no schema) — upsert garante que
// ela exista sem precisar de seed/migration de dado, só na primeira
// leitura ou escrita.
export async function isCatalogLocked(): Promise<boolean> {
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  return settings.catalogLocked;
}

export async function setCatalogLocked(locked: boolean): Promise<void> {
  await prisma.settings.upsert({
    where: { id: 1 },
    create: { id: 1, catalogLocked: locked },
    update: { catalogLocked: locked },
  });
}
