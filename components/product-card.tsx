import Image from "next/image";
import Link from "next/link";
import { SampleRequestControl } from "@/components/sample-request-control";
import { formatBRL } from "@/lib/format";
import type { Product, Brand } from "@/generated/prisma/client";

type ProductWithBrand = Product & { brand: Brand };

type LimitStatus = { used: number; limit: number; reached: boolean };

export function ProductCard({
  product,
  lastRequestedAt,
  limitStatus,
  index = 0,
}: {
  product: ProductWithBrand;
  lastRequestedAt: Date | null;
  limitStatus?: LimitStatus | null;
  index?: number;
}) {
  const photo = product.photoUrls[0];
  const hasFlash = product.flashPrice != null;

  return (
    <div
      className="animate-card-in flex flex-col rounded-[20px] bg-charcoal p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <Link href={`/produto/${product.id}`} className="block">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-mat">
          {photo ? (
            <Image
              src={photo}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink/40">Sem foto</div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-3">
        <Link href={`/produto/${product.id}`} className="block">
          <span className="text-caption text-mist">{product.brand.name}</span>
          <h3 className="mt-0.5 text-base text-paper">{product.name}</h3>
        </Link>

        {hasFlash ? (
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-mist">Vitrine</span>
              <span className="text-base font-bold text-paper">
                {formatBRL(Number(product.showcasePrice))}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-mist">Oferta</span>
              <span className="text-base font-bold text-gold">
                {formatBRL(Number(product.flashPrice))}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-mist">Comissão</span>
              <span className="text-base font-bold text-gold">
                {Number(product.flashCommissionPercent)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <div className="text-base font-bold text-paper">{formatBRL(Number(product.showcasePrice))}</div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-mist">Comissão</span>
              <span className="text-base font-bold text-gold">
                {Number(product.showcaseCommissionPercent)}%
              </span>
            </div>
          </div>
        )}

        {limitStatus && (
          <div
            className={`mt-2 text-xs ${limitStatus.reached ? "font-medium text-gold" : "text-mist"}`}
          >
            {limitStatus.reached
              ? "Limite de amostras desta marca atingido"
              : `${limitStatus.limit - limitStatus.used} amostra${limitStatus.limit - limitStatus.used === 1 ? "" : "s"} restante${limitStatus.limit - limitStatus.used === 1 ? "" : "s"} nesta marca`}
          </div>
        )}

        <div className="mt-3 flex-1" />
        <SampleRequestControl
          productId={product.id}
          requestBehavior={product.requestBehavior}
          tiktokShopUrl={product.tiktokShopUrl}
          lastRequestedAt={lastRequestedAt}
          className="mt-3"
        />
      </div>
    </div>
  );
}
