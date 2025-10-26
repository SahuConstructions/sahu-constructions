import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  async createPayroll(@Body() dto: { month: number; year: number }) {
    return this.payrollService.createPayrollRun(dto.month, dto.year);
  }

  @Get()
  async listPayrolls() {
    return this.payrollService.listPayrollRuns();
  }

  @Get(':id')
  async getPayroll(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.getPayrollRun(id);
  }

  @Post(':id/calculate')
  async calculate(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.calculatePayroll(id);
  }

  @Post(':id/finalize')
  async finalize(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.finalizePayroll(id);
  }

  @Post(':id/publish')
  async publish(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.publishPayroll(id);
  }

  @Patch('line-item/:id')
  async updatePayrollLineItem(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.payrollService.updatePayrollLineItem(id, dto);
  }

  @Get('mypayslips/:userId')
  async getMyPayslips(@Param('userId', ParseIntPipe) userId: number) {
    return this.payrollService.getMyPayslips(userId);
  }

  // ✅ Preview Payslip
  @Get('payslip/:lineItemId/preview')
  async previewPayslip(@Param('lineItemId', ParseIntPipe) id: number) {
    const payslip = await this.payrollService.getPayslip(id);
    if (!payslip || !payslip.pdfUrl)
      throw new NotFoundException('Payslip not found');
    return { url: payslip.pdfUrl };
  }

  // ✅ Download Payslip
  @Get('payslip/:lineItemId/download')
  async downloadPayslip(@Param('lineItemId', ParseIntPipe) id: number) {
    const payslip = await this.payrollService.getPayslip(id);
    if (!payslip || !payslip.pdfUrl)
      throw new NotFoundException('Payslip not found');

    let downloadUrl = payslip.pdfUrl;
    if (downloadUrl.includes('/upload/')) {
      downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
    }

    return { url: downloadUrl };
  }
}
