-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('HANDMADE', 'VINTAGE', 'SUPPLY');

-- DropIndex
DROP INDEX "cart_item_cartId_productId_key";

-- AlterTable
ALTER TABLE "cart_item" ADD COLUMN     "variantOptionId" TEXT;

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "variantLabel" TEXT,
ADD COLUMN     "variantOptionId" TEXT;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "personalization" TEXT,
ADD COLUMN     "processingTime" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'HANDMADE';

-- AlterTable
ALTER TABLE "review" ADD COLUMN     "sellerRespondedAt" TIMESTAMP(3),
ADD COLUMN     "sellerResponse" TEXT;

-- CreateTable
CREATE TABLE "product_variant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceDelta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "variantId" TEXT NOT NULL,

    CONSTRAINT "product_variant_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "reviewId" TEXT NOT NULL,

    CONSTRAINT "review_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_productId_key" ON "product_variant"("productId");

-- CreateIndex
CREATE INDEX "cart_item_cartId_productId_idx" ON "cart_item"("cartId", "productId");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "product_variant_option"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_variantOptionId_fkey" FOREIGN KEY ("variantOptionId") REFERENCES "product_variant_option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_image" ADD CONSTRAINT "review_image_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
