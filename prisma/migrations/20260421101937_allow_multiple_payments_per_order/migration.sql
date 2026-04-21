-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID_PARTIAL';

-- DropIndex
DROP INDEX "Payment_orderId_key";
