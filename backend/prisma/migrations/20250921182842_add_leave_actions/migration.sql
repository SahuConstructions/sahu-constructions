-- CreateTable
CREATE TABLE "LeaveAction" (
    "id" SERIAL NOT NULL,
    "leaveId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeaveAction" ADD CONSTRAINT "LeaveAction_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "Leave"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveAction" ADD CONSTRAINT "LeaveAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
