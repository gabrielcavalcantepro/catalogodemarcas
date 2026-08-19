"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Lock, LockOpen } from "lucide-react";
import { updateCatalogLocked } from "./actions";

export function CatalogLockToggle({ initialValue }: { initialValue: boolean }) {
  const [locked, setLocked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    const prev = locked;
    setLocked(next);
    startTransition(async () => {
      try {
        await updateCatalogLocked(next);
        toast.success(
          next
            ? "Catálogo trancado — só quem está cadastrado aqui pode entrar."
            : "Catálogo destrancado — qualquer @ pode se registrar.",
        );
      } catch {
        toast.error("Falha ao atualizar.");
        setLocked(prev);
      }
    });
  }

  return (
    <label className="flex items-center gap-3 rounded-[14px] border border-graphite bg-charcoal px-4 py-3 text-sm text-paper">
      <input
        type="checkbox"
        checked={locked}
        disabled={pending}
        onChange={(e) => handleChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-gold disabled:opacity-50"
      />
      {locked ? <Lock size={18} strokeWidth={1.75} className="text-gold" /> : <LockOpen size={18} strokeWidth={1.75} />}
      <span>
        <span className="font-medium">Catálogo trancado</span>
        <span className="ml-2 text-xs text-mist">
          {locked
            ? "só criadoras cadastradas aqui podem entrar"
            : "qualquer @ pode se registrar sozinho"}
        </span>
      </span>
    </label>
  );
}
