import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('punch')
  @UseInterceptors(
    FileInterceptor('selfie', {
      storage: diskStorage({
        destination: './temp_uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async punch(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAttendanceDto,
  ) {
    const userId = req.user.userId;

    // ✅ Attach file path to DTO so service uploads to Cloudinary
    const record = await this.attendanceService.create(userId, {
      ...dto,
      selfieFilePath: file?.path, // send file path if selfie exists
    });

    return {
      ok: true,
      record,
    };
  }

  @Get('me')
  async getMyAttendance(@Req() req) {
    const userId = req.user.userId;
    const records = await this.attendanceService.findByEmployee(userId);
    return { ok: true, records };
  }

  @Get('report/summary')
  @Roles('ADMIN')
  async summary() {
    return this.attendanceService.getSummary();
  }

  @Get('report/monthly/:year')
  @Roles('ADMIN', 'HR')
  async monthly(@Param('year') year: number) {
    return this.attendanceService.getMonthlySummary(year);
  }

  @Get('report/daily/:year/:month')
  @Roles('ADMIN', 'HR')
  async daily(@Param('year') year: number, @Param('month') month: number) {
    return this.attendanceService.getDailySummary(year, month);
  }

  @Get('report/employee-detail/:id/:year/:month')
  @Roles('HR', 'ADMIN')
  async employeeDetail(
    @Param('id') id: number,
    @Param('year') year: number,
    @Param('month') month: number,
  ) {
    return this.attendanceService.getEmployeeDetail(
      Number(id),
      Number(year),
      Number(month),
    );
  }

  @Get('manager-view')
  @Roles('MANAGER', 'ADMIN')
  async getManagerAttendanceView(@Req() req, @Query('date') date?: string) {
    const userId = req.user.userId;
    return this.attendanceService.getManagerAttendanceView(userId, date);
  }

  @Get('hr-view')
  @Roles('HR', 'ADMIN')
  async getHRAttendanceView(@Query('date') date?: string) {
    return this.attendanceService.getHRAttendanceView(date);
  }

}
