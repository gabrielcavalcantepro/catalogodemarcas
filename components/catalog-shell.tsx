"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";

type Brand = { id: string; name: string };

// Wrapper client-side pros pills de filtro: useTransition().isPending
// atualiza síncrono no momento do clique, independente de como o Next
// resolve o streaming da navegação internamente — tentei primeiro só com
// Suspense+key (convenção padrão do App Router), mas não disparava o
// fallback de forma confiável mesmo com a navegação atrasada
// artificialmente em teste, provavelmente por causa de como o router
// decide quando trocar a árvore visível. Isso aqui é mais direto e
// garantido: enquanto isPending, mostra o skeleton; assim que o novo
// `children` (grade já renderizada no servidor pro brandId novo) chega,
// troca de volta.
export function CatalogShell({
  brands,
  activeBrandId,
  children,
}: {
  brands: Brand[];
  activeBrandId?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function go(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-ink px-4 py-2 sm:-mx-6 sm:px-6">
        <FilterPill label="Todas as marcas" active={!activeBrandId} onClick={() => go("/")} />
        {brands.map((brand) => (
          <FilterPill
            key={brand.id}
            label={brand.name}
            active={activeBrandId === brand.id}
            onClick={() => go(`/?marca=${brand.id}`)}
          />
        ))}
      </div>

      {isPending ? <ProductGridSkeleton /> : children}
    </>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-gold px-3 text-sm font-bold whitespace-nowrap text-ink transition-colors duration-150"
          : "inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-charcoal px-3 text-sm whitespace-nowrap text-mist transition-colors duration-150 hover:text-paper"
      }
    >
      {label}
    </button>
  );
}
