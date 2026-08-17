import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui";

export default async function AdminHomePage() {
  const [brandCount, productCount, pendingCount, creatorCount] = await Promise.all([
    prisma.brand.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.sampleRequest.count({
      where: { behaviorAtRequest: "NOTIFY_TEAM", status: "PENDING" },
    }),
    prisma.creator.count(),
  ]);

  const stats = [
    { label: "Marcas", value: brandCount, href: "/admin/marcas" },
    { label: "Produtos ativos", value: productCount, href: "/admin/produtos" },
    { label: "Solicitações pendentes", value: pendingCount, href: "/admin/fila" },
    { label: "Criadoras cadastradas", value: creatorCount, href: "/admin/criadoras" },
  ];

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Painel X Performance</h1>
      <p className="mt-1 text-sm text-mist">Visão geral do catálogo e das solicitações.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 transition-colors hover:bg-graphite">
              <div className="font-display text-heading-md text-gold">{stat.value}</div>
              <div className="mt-1 text-sm text-mist">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
