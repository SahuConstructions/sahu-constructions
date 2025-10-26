/*
  Warnings:

  - A unique constraint covering the columns `[payrollRunId,employeeId]` on the table `PayrollLineItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PayrollLineItem_payrollRunId_employeeId_key" ON "PayrollLineItem"("payrollRunId", "employeeId");
