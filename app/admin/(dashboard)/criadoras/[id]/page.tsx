import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CreatorForm } from "../creator-form";
import { updateCreator } from "../actions";

export default async function EditarCriadoraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creator.findUnique({ where: { id } });
  if (!creator) notFound();

  return (
    <div>
      <h1 className="font-display text-heading-md text-paper">Editar criadora</h1>
      <div className="mt-6">
        <CreatorForm
          action={updateCreator.bind(null, creator.id)}
          defaultValues={{
            name: creator.name,
            email: creator.email,
            tiktokHandle: creator.tiktokHandle,
          }}
        />
      </div>
    </div>
  );
}
