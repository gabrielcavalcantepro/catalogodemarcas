"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { requestSample, type RequestSampleState } from "@/app/(public)/actions";
import { Button } from "@/components/ui";

const initialState: RequestSampleState = {};

// Os dois comportamentos de produto (spec §6.1) viram UIs bem diferentes
// aqui: REDIRECT_TIKTOK_SHOP é só um link externo, sem tracking nenhum —
// sempre clicável, nunca vira "já solicitado", nunca aparece em Minhas
// Solicitações (requestSample nem chega a ser chamada). NOTIFY_TEAM é o
// único fluxo que passa pela Server Action e, uma vez solicitado, não
// existe mais botão — evita reenvio (a @@unique([creatorId, productId])
// garante isso no banco também) e o layout de "botão + texto disputando o
// mesmo espaço".
export function SampleRequestControl({
  productId,
  requestBehavior,
  tiktokShopUrl,
  lastRequestedAt,
  className,
}: {
  productId: string;
  requestBehavior: "NOTIFY_TEAM" | "REDIRECT_TIKTOK_SHOP";
  tiktokShopUrl: string | null;
  lastRequestedAt: Date | null;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(requestSample, initialState);

  useEffect(() => {
    if (state.success) toast.success("Amostra solicitada!");
  }, [state]);

  if (requestBehavior === "REDIRECT_TIKTOK_SHOP") {
    return (
      <a href={tiktokShopUrl ?? "#"} target="_blank" rel="noopener noreferrer" className={className}>
        <Button type="button" className="w-full">
          Ir para a loja
        </Button>
      </a>
    );
  }

  if (lastRequestedAt) {
    return (
      <div
        className={`min-h-11 rounded-[10px] border border-graphite px-3 py-3 text-center text-xs text-mist ${className ?? ""}`}
      >
        <p>
          Já solicitado em{" "}
          {lastRequestedAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })}
        </p>
        <p className="mt-1 text-mist/70">
          Nossa equipe vai aprovar a sua solicitação e enviar um convite no TikTok.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <Button type="submit" disabled={pending} className="w-full">
        Quero solicitar amostra
      </Button>
    </form>
  );
}
