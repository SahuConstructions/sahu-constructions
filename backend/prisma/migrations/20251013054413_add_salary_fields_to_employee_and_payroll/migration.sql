-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "basicSalary" DOUBLE PRECISION,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "pfNumber" TEXT,
ADD COLUMN     "uan" TEXT;

-- AlterTable
ALTER TABLE "PayrollLineItem" ADD COLUMN     "basic" DOUBLE PRECISION,
ADD COLUMN     "hra" DOUBLE PRECISION,
ADD COLUMN     "lopDays" INTEGER,
ADD COLUMN     "otherAllowance" DOUBLE PRECISION,
ADD COLUMN     "pf" DOUBLE PRECISION,
ADD COLUMN     "pt" DOUBLE PRECISION;
