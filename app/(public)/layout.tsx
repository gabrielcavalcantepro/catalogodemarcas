import Link from "next/link";
import { LayoutGrid, ClipboardList, CircleUserRound } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCreatorId } from "@/lib/auth/creator";
import { prisma } from "@/lib/db";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const creatorId = await getCreatorId();
  const creator = creatorId
    ? await prisma.creator.findUnique({ where: { id: creatorId } })
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-graphite">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          {creator && (
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/minhas-solicitacoes"
                aria-label="Minhas Solicitações"
                className="text-mist transition-colors duration-150 hover:text-gold md:hidden"
              >
                <ClipboardList size={22} strokeWidth={1.75} />
              </Link>
              <Link
                href="/"
                className="hidden items-center gap-2 text-paper transition-colors duration-150 hover:text-gold md:flex"
              >
                <LayoutGrid size={18} strokeWidth={1.75} />
                Catálogo
              </Link>
              <Link
                href="/minhas-solicitacoes"
                className="hidden items-center gap-2 text-paper transition-colors duration-150 hover:text-gold md:flex"
              >
                <ClipboardList size={18} strokeWidth={1.75} />
                Minhas Solicitações
              </Link>
              <span className="ml-1 flex items-center gap-1.5 border-l border-graphite pl-4 text-mist">
                <CircleUserRound size={18} strokeWidth={1.75} />
                @{creator.tiktokHandle}
              </span>
            </nav>
          )}
        </div>
      </header>
      {/* Doc pede max 640px "área pública", mas também pede grid de 3-4
          colunas ≥1024px — as duas coisas não cabem juntas. Deixo o shell
          mais largo (4xl) pra caber a grade, e as telas de leitura estreita
          (registro/login/detalhe/minhas-solicitações) se limitam a 640px
          por dentro, individualmente. */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
