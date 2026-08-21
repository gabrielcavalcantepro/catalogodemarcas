"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSampleDeliveryStatus } from "@/app/admin/(dashboard)/amostras/actions";

type DeliveryStatus = "IN_TRANSIT" | "RECEIVED";

export function InlineDeliveryStatus({
  deliveryId,
  initialValue,
}: {
  deliveryId: string;
  initialValue: DeliveryStatus;
}) {
  const [status, setStatus] = useState<DeliveryStatus>(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: DeliveryStatus) {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      try {
        await updateSampleDeliveryStatus(deliveryId, next);
        toast.success("Status atualizado.");
      } catch {
        toast.error("Falha ao atualizar status.");
        setStatus(prev);
      }
    });
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as DeliveryStatus)}
      className="rounded-md border border-graphite bg-graphite px-2 py-1.5 text-sm text-paper transition-colors duration-150 focus:border-gold focus:outline-none disabled:opacity-50"
    >
      <option value="IN_TRANSIT">Em trânsito</option>
      <option value="RECEIVED">Recebida</option>
    </select>
  );
}
