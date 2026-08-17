"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Ações que redirecionam após sucesso (criar/editar Marca, Produto,
// Criadora) anexam ?toast=mensagem no destino em vez de só revalidar —
// esse componente lê o parâmetro no mount, mostra o toast e limpa a URL
// (sem isso, dar refresh ou voltar mostraria o toast de novo).
export function ToastFromQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get("toast");

  useEffect(() => {
    if (!message) return;
    toast.success(message);
    const params = new URLSearchParams(searchParams);
    params.delete("toast");
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }, [message, pathname, router, searchParams]);

  return null;
}
