import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCreatorId } from "@/lib/auth/creator";
import { getLimitStatusForPairs, limitKey } from "@/lib/sample-limits";
import { SampleRequestControl } from "@/components/sample-request-control";
import { ProductGallery } from "@/components/product-gallery";
import { ExpandableDescription } from "@/components/expandable-description";
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

  const limitStatusMap = await getLimitStatusForPairs([
    { creatorId, brandId: product.brandId, brandDefaultLimit: product.brand.defaultSampleLimit },
  ]);
  const limitStatus = limitStatusMap.get(limitKey(creatorId, product.brandId));

  const hasFlash = product.flashPrice != null;
  // O admin às vezes cola descrição com parágrafos separados por mais de
  // uma linha em branco — normaliza pra no máximo uma (o dobro virava
  // "espaço duplo" visível, já que whitespace-pre-line preserva cada \n).
  const description = product.description.replace(/\n{3,}/g, "\n\n");

  return (
    <div className="mx-auto max-w-4xl pb-32 md:pb-0">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-mist transition-colors duration-150 hover:text-gold"
      >
        <ArrowLeft size={16} strokeWidth={2} />
        Voltar ao catálogo
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery photoUrls={product.photoUrls} alt={product.name} />

        <div>
          <span className="text-caption text-mist">{product.brand.name}</span>
          <h1 className="mt-1 font-display text-xl text-paper md:text-2xl">{product.name}</h1>
          <ExpandableDescription text={description} />

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
              <span className="text-lg font-bold text-paper">
                {formatBRL(Number(product.showcasePrice))}
              </span>
            </div>
            {!hasFlash && (
              <div className="mt-1 text-right text-sm font-semibold text-gold">
                {Number(product.showcaseCommissionPercent)}% de comissão
              </div>
            )}

            {hasFlash && (
              <div className="mt-3 border-t border-graphite pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-mist">Preço de oferta relâmpago</span>
                  <span className="text-lg font-bold text-gold">
                    {formatBRL(Number(product.flashPrice))}
                  </span>
                </div>
                <div className="mt-1 text-right text-sm font-semibold text-gold">
                  {Number(product.flashCommissionPercent)}% de comissão
                </div>
              </div>
            )}
          </div>

          {limitStatus && (
            <div className={`mt-3 text-sm ${limitStatus.reached ? "font-medium text-gold" : "text-mist"}`}>
              {limitStatus.reached
                ? "Limite de amostras desta marca atingido"
                : `${limitStatus.limit - limitStatus.used} amostra${limitStatus.limit - limitStatus.used === 1 ? "" : "s"} restante${limitStatus.limit - limitStatus.used === 1 ? "" : "s"} nesta marca`}
            </div>
          )}

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
