-- Dedupe existing SampleRequest rows (same creator+product) before adding
-- the unique constraint below. Keeps the earliest row per pair.
DELETE FROM "SampleRequest" sr
USING "SampleRequest" earlier
WHERE sr."creatorId" = earlier."creatorId"
  AND sr."productId" = earlier."productId"
  AND (
    earlier."createdAt" < sr."createdAt"
    OR (earlier."createdAt" = sr."createdAt" AND earlier."id" < sr."id")
  );

-- AlterTable: rename single commission field, add pricing fields
ALTER TABLE "Product" RENAME COLUMN "commissionPercent" TO "showcaseCommissionPercent";
ALTER TABLE "Product" ADD COLUMN "showcasePrice" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Product" ALTER COLUMN "showcasePrice" DROP DEFAULT;
ALTER TABLE "Product" ADD COLUMN "flashPrice" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN "flashCommissionPercent" DECIMAL(5,2);

-- CreateIndex
CREATE UNIQUE INDEX "SampleRequest_creatorId_productId_key" ON "SampleRequest"("creatorId", "productId");
