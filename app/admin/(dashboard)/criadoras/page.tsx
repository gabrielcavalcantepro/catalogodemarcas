import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ResponsiveTable, type ResponsiveTableColumn } from "@/components/responsive-table";
import { deleteCreator } from "./actions";

type CreatorRow = Awaited<ReturnType<typeof getCreators>>[number];

async function getCreators() {
  return prisma.creator.findMany({ orderBy: { createdAt: "desc" } });
}

export default async function CriadorasPage() {
  const creators = await getCreators();

  const columns: ResponsiveTableColumn<CreatorRow>[] = [
    { header: "@ TikTok", cell: (c) => `@${c.tiktokHandle}` },
    { header: "Nome", cell: (c) => c.name ?? "—" },
    { header: "E-mail", cell: (c) => c.email ?? "—" },
    {
      header: "Status",
      cell: (c) =>
        c.name ? (
          <span className="text-xs text-mist">Registrada</span>
        ) : (
          <span className="rounded-full bg-gold/15 px-2 py-1 text-xs font-medium text-gold">
            Aguardando registro
          </span>
        ),
    },
    {
      header: "Cadastrada em",
      cell: (c) => <span className="font-mono text-xs">{c.createdAt.toLocaleDateString("pt-BR")}</span>,
    },
    {
      header: "",
      cell: (c) => (
        <div className="flex justify-end gap-2">
          <Link href={`/admin/criadoras/${c.id}`}>
            <Button variant="secondary">
              <Pencil size={16} strokeWidth={1.75} />
              Editar
            </Button>
          </Link>
          <form action={deleteCreator}>
            <input type="hidden" name="creatorId" value={c.id} />
            <ConfirmSubmitButton
              confirmMessage={`Excluir a criadora "${c.name ?? c.tiktokHandle}"? Isso remove também o histórico de solicitações, limites e divulgações dela.`}
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
        <h1 className="font-display text-heading-md text-paper">Criadoras</h1>
        <Link href="/admin/criadoras/nova">
          <Button>
            <Plus size={18} strokeWidth={1.75} />
            Nova criadora
          </Button>
        </Link>
      </div>
      <p className="mt-1 text-sm text-mist">
        Cadastre o @ do TikTok antes da criadora acessar — sem essa linha
        aqui, o registro público dela é recusado. Nome e e-mail são
        preenchidos por ela mesma no registro.
      </p>

      {creators.length === 0 ? (
        <p className="mt-12 text-mist">Nenhuma criadora cadastrada ainda.</p>
      ) : (
        <div className="mt-6">
          <ResponsiveTable columns={columns} rows={creators} rowKey={(c) => c.id} />
        </div>
      )}
    </div>
  );
}
