-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MONOBANK';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentProviderInvoiceId" TEXT,
ADD COLUMN     "paymentProviderPayload" JSONB,
ADD COLUMN     "shippingCityRef" TEXT,
ADD COLUMN     "shippingWarehouseRef" TEXT;

-- AlterTable
ALTER TABLE "SavedAddress" ADD COLUMN     "cityRef" TEXT,
ADD COLUMN     "warehouseRef" TEXT;
