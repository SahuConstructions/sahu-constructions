import { Module } from '@nestjs/common';
import { ReimbursementsService } from './reimbursements.service';
import { ReimbursementsController } from './reimbursements.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../uploads/upload.module'; // ✅ Import Cloudinary upload module

@Module({
  imports: [PrismaModule, UploadModule], // ✅ no need for Multer diskStorage now
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService],
})
export class ReimbursementsModule {}
