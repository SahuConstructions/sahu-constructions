-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "hrId" INTEGER,
ADD COLUMN     "managerId" INTEGER,
ALTER COLUMN "status" SET DEFAULT 'PendingManager';
