/*
  Warnings:

  - You are about to drop the column `lat` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Attendance` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "lat",
DROP COLUMN "lng",
ADD COLUMN     "location" TEXT;
