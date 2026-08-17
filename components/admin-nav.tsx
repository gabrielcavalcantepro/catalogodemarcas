"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Inbox,
  SlidersHorizontal,
  Video,
  type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Início", icon: LayoutDashboard },
  { href: "/admin/criadoras", label: "Criadoras", icon: Users },
  { href: "/admin/marcas", label: "Marcas", icon: Building2 },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/fila", label: "Fila de Solicitações", icon: Inbox },
  { href: "/admin/limites", label: "Limites por Criadora", icon: SlidersHorizontal },
  { href: "/admin/divulgacoes", label: "Divulgações", icon: Video },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:space-y-1 md:overflow-visible md:py-4">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-full border-l-[3px] border-gold bg-gold/8 px-3 text-sm text-paper transition-colors duration-150 md:w-full md:rounded-md md:pl-[9px]"
                : "flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-full border-l-[3px] border-transparent px-3 text-sm text-mist transition-colors duration-150 hover:bg-ink hover:text-gold md:w-full md:rounded-md md:pl-[9px]"
            }
          >
            <Icon size={20} strokeWidth={1.75} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
