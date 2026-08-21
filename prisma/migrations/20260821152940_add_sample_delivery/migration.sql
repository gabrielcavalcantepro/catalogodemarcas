-- CreateEnum
CREATE TYPE "SampleDeliveryStatus" AS ENUM ('IN_TRANSIT', 'RECEIVED');

-- CreateTable
CREATE TABLE "SampleDelivery" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "SampleDeliveryStatus" NOT NULL DEFAULT 'IN_TRANSIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SampleDelivery_creatorId_idx" ON "SampleDelivery"("creatorId");

-- CreateIndex
CREATE INDEX "SampleDelivery_brandId_idx" ON "SampleDelivery"("brandId");

-- CreateIndex
CREATE INDEX "SampleDelivery_productId_idx" ON "SampleDelivery"("productId");

-- AddForeignKey
ALTER TABLE "SampleDelivery" ADD CONSTRAINT "SampleDelivery_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleDelivery" ADD CONSTRAINT "SampleDelivery_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleDelivery" ADD CONSTRAINT "SampleDelivery_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
