"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutGrid, ClipboardList, CircleUserRound } from "lucide-react";

export function MobileNav({ tiktokHandle }: { tiktokHandle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="flex h-9 w-9 cursor-pointer items-center justify-center text-paper"
      >
        {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-20 mt-2 w-56 rounded-[14px] border border-graphite bg-charcoal p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
          <nav className="flex flex-col gap-0.5">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-paper transition-colors duration-150 hover:bg-ink"
            >
              <LayoutGrid size={18} strokeWidth={1.75} />
              Catálogo
            </Link>
            <Link
              href="/minhas-solicitacoes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-paper transition-colors duration-150 hover:bg-ink"
            >
              <ClipboardList size={18} strokeWidth={1.75} />
              Minhas Solicitações
            </Link>
          </nav>
          <div className="mt-1 flex items-center gap-2 border-t border-graphite px-3 pt-3 text-sm text-mist">
            <CircleUserRound size={18} strokeWidth={1.75} />@{tiktokHandle}
          </div>
        </div>
      )}
    </div>
  );
}
