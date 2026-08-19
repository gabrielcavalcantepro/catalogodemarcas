-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "catalogLocked" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
