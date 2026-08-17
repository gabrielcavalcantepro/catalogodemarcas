"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { requestSample, type RequestSampleState } from "@/app/(public)/actions";
import { Button } from "@/components/ui";

const initialState: RequestSampleState = {};

// Uma vez solicitado, não existe mais botão — evita reenvio (a
// @@unique([creatorId, productId]) garante isso no banco também) e o
// layout de "botão + texto disputando o mesmo espaço".
export function SampleRequestControl({
  productId,
  lastRequestedAt,
  className,
}: {
  productId: string;
  lastRequestedAt: Date | null;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(requestSample, initialState);

  useEffect(() => {
    if (state.success) toast.success("Amostra solicitada!");
  }, [state]);

  if (lastRequestedAt) {
    return (
      <div
        className={`min-h-11 rounded-[10px] border border-graphite px-3 py-3 text-center text-xs text-mist ${className ?? ""}`}
      >
        Já solicitado em{" "}
        {lastRequestedAt.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })}
      </div>
    );
  }

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="productId" value={productId} />
      <Button type="submit" disabled={pending} className="w-full">
        Solicitar Amostra
      </Button>
    </form>
  );
}
