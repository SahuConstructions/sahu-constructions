/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Timesheet` table. All the data in the column will be lost.
  - The `status` column on the `Timesheet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TimesheetStatus" AS ENUM ('PendingManager', 'PendingHR', 'Approved', 'RejectedByManager', 'RejectedByHR', 'Overridden');

-- AlterTable
ALTER TABLE "Timesheet" DROP COLUMN "updatedAt",
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "reviewedById" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "TimesheetStatus" NOT NULL DEFAULT 'PendingManager';

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
