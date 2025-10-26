import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../uploads/upload.service'; // ✅ import here

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PrismaService, UploadService], // ✅ add UploadService here
})
export class PayrollModule {}
