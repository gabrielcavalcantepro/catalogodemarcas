"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  quickUpdateActive,
  quickUpdateBehavior,
  quickUpdatePrice,
} from "@/app/admin/(dashboard)/produtos/actions";

const controlClass =
  "rounded-md border border-graphite bg-graphite px-2 py-1.5 text-sm text-paper transition-colors duration-150 focus:border-gold focus:outline-none disabled:opacity-50";

export function InlineEditPrice({ productId, initialValue }: { productId: string; initialValue: number }) {
  const [value, setValue] = useState(String(initialValue));
  const [pending, startTransition] = useTransition();

  function commit() {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      toast.error("Preço inválido.");
      setValue(String(initialValue));
      return;
    }
    if (num === initialValue) return;
    startTransition(async () => {
      try {
        await quickUpdatePrice(productId, num);
        toast.success("Preço atualizado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao atualizar preço.");
        setValue(String(initialValue));
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-mist">R$</span>
      <input
        type="number"
        step="0.01"
        min={0}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className={`${controlClass} w-24 font-mono`}
      />
    </div>
  );
}

export function InlineEditBehavior({
  productId,
  initialValue,
}: {
  productId: string;
  initialValue: "NOTIFY_TEAM" | "REDIRECT_TIKTOK_SHOP";
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: "NOTIFY_TEAM" | "REDIRECT_TIKTOK_SHOP") {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        await quickUpdateBehavior(productId, next);
        toast.success("Comportamento atualizado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao atualizar comportamento.");
        setValue(prev);
      }
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value as "NOTIFY_TEAM" | "REDIRECT_TIKTOK_SHOP")}
      className={controlClass}
    >
      <option value="NOTIFY_TEAM">Notifica equipe</option>
      <option value="REDIRECT_TIKTOK_SHOP">Redireciona p/ TikTok Shop</option>
    </select>
  );
}

export function InlineEditActive({ productId, initialValue }: { productId: string; initialValue: boolean }) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      try {
        await quickUpdateActive(productId, next);
        toast.success(next ? "Produto ativado." : "Produto desativado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao atualizar status.");
        setValue(prev);
      }
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-mist">
      <input
        type="checkbox"
        checked={value}
        disabled={pending}
        onChange={(e) => handleChange(e.target.checked)}
      />
      {value ? "Ativo" : "Inativo"}
    </label>
  );
}
