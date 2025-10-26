import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceGateway } from './attendance.gateway';
import { UploadModule } from '../uploads/upload.module'; // ✅ Import UploadModule

@Module({
  imports: [UploadModule], // ✅ Add UploadModule so UploadService can be injected
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, AttendanceGateway],
})
export class AttendanceModule {}
