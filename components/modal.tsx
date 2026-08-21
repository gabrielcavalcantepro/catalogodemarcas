"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Modal genérico — não existia nenhum componente de dialog no projeto
// ainda (só Select/Popover/Calendar do shadcn, que não servem pra isso).
// Overlay + painel centralizado, fecha com Escape ou clique no overlay.
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-void/70 p-4 pt-16 backdrop-blur-sm md:pt-24"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} rounded-[20px] bg-charcoal p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-heading-sm text-paper">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-mist transition-colors duration-150 hover:bg-ink hover:text-paper"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
