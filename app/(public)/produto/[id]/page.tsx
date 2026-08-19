import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCreatorId } from "@/lib/auth/creator";
import { SampleRequestControl } from "@/components/sample-request-control";
import { formatBRL } from "@/lib/format";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const creatorId = await getCreatorId();
  if (!creatorId) {
    redirect("/");
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true },
  });
  if (!product || !product.active) notFound();

  const lastRequest = await prisma.sampleRequest.findUnique({
    where: { creatorId_productId: { creatorId, productId: product.id } },
  });

  const hasFlash = product.flashPrice != null;

  return (
    <div className="mx-auto max-w-[640px] pb-32 md:pb-0">
      <Link href="/" className="text-sm text-mist hover:text-gold">
        ← Voltar ao catálogo
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-mat">
            {product.photoUrls[0] ? (
              <Image
                src={product.photoUrls[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                priority
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-ink/40">
                Sem foto
              </div>
            )}
          </div>
          {product.photoUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.photoUrls.slice(1).map((url) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-[10px] bg-mat">
                  <Image src={url} alt={product.name} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-caption text-mist">{product.brand.name}</span>
          <h1 className="mt-1 font-display text-heading-md text-paper">{product.name}</h1>
          <p className="mt-3 whitespace-pre-line text-sm text-mist">{product.description}</p>

          {product.differentials.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.differentials.map((d, i) => (
                <span
                  key={i}
                  className="rounded-full border border-graphite px-2.5 py-1 text-xs text-mist"
                >
                  {d}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-[20px] bg-charcoal p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-mist">Preço de vitrine</span>
              <span className="font-display text-heading-sm text-paper">
                {formatBRL(Number(product.showcasePrice))}
              </span>
            </div>
            {!hasFlash && (
              <div className="mt-1 text-right font-display text-heading-sm text-gold">
                {Number(product.showcaseCommissionPercent)}% de comissão
              </div>
            )}

            {hasFlash && (
              <div className="mt-3 flex items-baseline justify-between border-t border-graphite pt-3">
                <span className="text-sm text-mist">Preço de oferta relâmpago</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-heading-sm text-gold">
                    {formatBRL(Number(product.flashPrice))}
                  </span>
                  <span className="text-sm font-semibold text-gold">
                    {Number(product.flashCommissionPercent)}%
                  </span>
                </span>
              </div>
            )}
          </div>

          <SampleRequestControl
            productId={product.id}
            requestBehavior={product.requestBehavior}
            tiktokShopUrl={product.tiktokShopUrl}
            lastRequestedAt={lastRequest?.createdAt ?? null}
            className="mt-4 hidden md:block"
          />
        </div>
      </div>

      {/* Mobile: CTA sempre acessível sem rolar até o fim (§ Detalhe do Produto) */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-graphite bg-ink p-4 md:hidden">
        <SampleRequestControl
          productId={product.id}
          requestBehavior={product.requestBehavior}
          tiktokShopUrl={product.tiktokShopUrl}
          lastRequestedAt={lastRequest?.createdAt ?? null}
        />
      </div>
    </div>
  );
}
