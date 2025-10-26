/*
  Warnings:

  - The values [PENDING] on the enum `ReimbursementStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReimbursementStatus_new" AS ENUM ('PENDING_MANAGER', 'PENDING_HR', 'PENDING_FINANCE', 'APPROVED', 'REJECTED');
ALTER TABLE "Reimbursement" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Reimbursement" ALTER COLUMN "status" TYPE "ReimbursementStatus_new" USING ("status"::text::"ReimbursementStatus_new");
ALTER TYPE "ReimbursementStatus" RENAME TO "ReimbursementStatus_old";
ALTER TYPE "ReimbursementStatus_new" RENAME TO "ReimbursementStatus";
DROP TYPE "ReimbursementStatus_old";
ALTER TABLE "Reimbursement" ALTER COLUMN "status" SET DEFAULT 'PENDING_MANAGER';
COMMIT;

-- AlterTable
ALTER TABLE "Reimbursement" ALTER COLUMN "status" SET DEFAULT 'PENDING_MANAGER';
