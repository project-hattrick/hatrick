-- CreateEnum
CREATE TYPE "StoreItemKind" AS ENUM ('Pack', 'Bundle', 'Card');

-- AlterEnum
ALTER TYPE "WalletTxType" ADD VALUE 'StorePurchase';

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "StoreItemKind" NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_items_slug_key" ON "store_items"("slug");

-- CreateIndex
CREATE INDEX "store_items_kind_idx" ON "store_items"("kind");
