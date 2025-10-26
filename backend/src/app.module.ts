import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeavesModule } from './leaves/leaves.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { PayrollModule } from './payroll/payroll.module';
import { ReimbursementsModule } from './reimbursements/reimbursements.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './uploads/upload.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    LeavesModule,
    TimesheetsModule,
    PayrollModule,
    ReimbursementsModule,
    AdminModule,
    UploadModule,
  ],
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: RolesGuard,
  //   },
  // ],
})
export class AppModule {}
