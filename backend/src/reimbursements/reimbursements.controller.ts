import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReimbursementsService } from './reimbursements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { Response } from 'express';
import { UploadService } from '../uploads/upload.service';

@Controller('reimbursements')
@UseGuards(JwtAuthGuard)
export class ReimbursementsController {
  constructor(
    private service: ReimbursementsService,
    private uploadService: UploadService,
  ) {}

  // 👤 Employee submits reimbursement
  @Post()
  @UseInterceptors(FileInterceptor('receipt'))
  async create(
    @User() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { amount: number; description?: string },
  ) {
    let receiptUrl: string | undefined;

    try {
      if (file) {
        const upload = await this.uploadService.uploadBuffer(
          file.buffer,
          'reimbursements',
          file.originalname.replace(/\.[^/.]+$/, ''),
        );
        receiptUrl = upload.secure_url;
      }

      const reimbursement = await this.service.create(user.userId ?? user.sub, {
        amount: parseFloat(String(body.amount)),
        description: body.description,
        receiptUrl,
      });

      return { ok: true, reimbursement };
    } catch (err) {
      console.error('Reimbursement upload error:', err);
      throw err;
    }
  }

  // 👤 Employee’s own reimbursements
  @Get('me')
  async myReimbursements(@User() user: any) {
    return this.service.getMyReimbursements(user.userId ?? user.sub);
  }

  // 👩‍💼 Manager / HR / Finance view list
  @Get()
  async listAll(@User() user: any) {
    return this.service.listAll(user);
  }

  // ✅ Approve / Reject
  @Post(':id/resolve')
  async resolve(
    @Param('id', ParseIntPipe) id: number,
    @User() user: any,
    @Body() body: { status: 'APPROVED' | 'REJECTED'; notes?: string },
  ) {
    return this.service.resolve(id, user.userId ?? user.sub, body.status, body.notes);
  }

  // 📜 History
  @Get(':id/history')
  async history(@Param('id', ParseIntPipe) id: number) {
    return this.service.getHistory(id);
  }

  // 🧾 Receipt preview / redirect
  @Get(':id/receipt')
  async downloadReceipt(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const r = await this.service.getById(id);
    if (!r || !r.receiptUrl) throw new NotFoundException('Receipt not found');

    if (r.receiptUrl.startsWith('http')) return res.redirect(r.receiptUrl);
    throw new NotFoundException('Invalid receipt file');
  }
}
