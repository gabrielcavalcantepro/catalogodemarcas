import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin-nav";
import { ToastFromQuery } from "@/components/toast-from-query";
import { logoutAdmin } from "./actions";

// A autenticação do admin roda em proxy.ts (fora da árvore de render), então
// nenhuma página aqui embaixo é forçada a ler uma Request-time API sozinha —
// sem isso, o Next prerenderiza páginas como /admin/divulgacoes como HTML
// estático no build e serve esse snapshot congelado em produção, ignorando
// criadoras/marcas cadastradas depois do deploy.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Suspense fallback={null}>
        <ToastFromQuery />
      </Suspense>
      <aside className="flex flex-col border-b border-graphite bg-charcoal md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-graphite px-6 py-4 md:py-5">
          <Logo />
        </div>
        <AdminNav />
        <form action={logoutAdmin} className="border-t border-graphite p-3">
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-sm text-mist transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            <LogOut size={20} strokeWidth={1.75} />
            Sair
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-ink px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
