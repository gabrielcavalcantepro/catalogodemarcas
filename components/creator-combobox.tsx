"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type CreatorOption = {
  id: string;
  tiktokHandle: string;
  name: string | null;
  approved: boolean;
};

// Select customizado (não o Base UI Select) — precisa de busca embutida
// (não é um padrão que dá pra encaixar bem num <select> tradicional) e
// posicionamento sempre abaixo do trigger (o Select do shadcn tem
// alignItemWithTrigger=true por padrão, que tenta alinhar o item
// selecionado com o trigger e às vezes cobre o campo acima dele — aqui
// o dropdown é um <div absolute top-full>, nunca sobe).
export function CreatorCombobox({
  name,
  creators,
  defaultValue,
  required,
}: {
  name: string;
  creators: CreatorOption[];
  defaultValue?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(
    () => [...creators].sort((a, b) => a.tiktokHandle.localeCompare(b.tiktokHandle)),
    [creators],
  );
  const selected = sorted.find((c) => c.id === selectedId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) => c.tiktokHandle.toLowerCase().includes(q) || (c.name ?? "").toLowerCase().includes(q),
    );
  }, [sorted, search]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    } else {
      setSearch("");
    }
  }, [open]);

  function statusDotClass(c: CreatorOption) {
    return c.name && c.approved ? "bg-emerald-500" : "bg-orange-400";
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} readOnly required={required} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border border-transparent bg-graphite px-3 text-left text-sm text-paper transition-colors duration-150 focus:border-gold focus:outline-none"
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(selected)}`} />
            <span className="truncate">@{selected.tiktokHandle}</span>
          </span>
        ) : (
          <span className="text-mist">Selecione...</span>
        )}
        <ChevronDown size={16} strokeWidth={1.75} className="shrink-0 text-mist" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-full min-w-64 overflow-hidden rounded-[10px] border border-graphite bg-charcoal shadow-lg">
          <div className="border-b border-graphite p-2">
            <div className="flex items-center gap-2 rounded-md bg-graphite px-2.5 py-2">
              <Search size={14} strokeWidth={1.75} className="shrink-0 text-mist" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por @..."
                className="w-full bg-transparent text-sm text-paper placeholder:text-mist focus:outline-none"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-mist">Nenhuma criadora encontrada.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(c.id);
                      setOpen(false);
                    }}
                    className={`flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-ink ${
                      c.id === selectedId ? "bg-ink text-gold" : "text-paper"
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(c)}`} />
                    <span className="truncate">@{c.tiktokHandle}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
