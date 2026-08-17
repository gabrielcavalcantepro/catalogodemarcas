-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "email" TEXT NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Creator_email_key" ON "Creator"("email");
