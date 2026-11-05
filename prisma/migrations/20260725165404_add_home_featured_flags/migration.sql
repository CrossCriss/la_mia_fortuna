-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isFeaturedOnHome" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;
