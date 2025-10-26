-- CreateTable
CREATE TABLE "ReimbursementAction" (
    "id" SERIAL NOT NULL,
    "reimbursementId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReimbursementAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReimbursementAction" ADD CONSTRAINT "ReimbursementAction_reimbursementId_fkey" FOREIGN KEY ("reimbursementId") REFERENCES "Reimbursement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementAction" ADD CONSTRAINT "ReimbursementAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
