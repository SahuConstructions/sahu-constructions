import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemOverview() {
    const [employees, leaves, timesheets, reimbursements, payrolls] =
      await Promise.all([
        this.prisma.employee.count(),
        this.prisma.leave.count(),
        this.prisma.timesheet.count(),
        this.prisma.reimbursement.count(),
        this.prisma.payroll.count(),
      ]);

    return {
      totalEmployees: employees,
      totalLeaves: leaves,
      totalTimesheets: timesheets,
      totalReimbursements: reimbursements,
      totalPayrolls: payrolls,
    };
  }

  async getRecentActivity() {
    const activities = await Promise.all([
      this.prisma.leave.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      }),
      this.prisma.timesheet.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      }),
      this.prisma.reimbursement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { employee: true },
      }),
    ]);

    return {
      recentLeaves: activities[0],
      recentTimesheets: activities[1],
      recentReimbursements: activities[2],
    };
  }

  async getAdminSummary() {
    const leavesByStatus = await this.prisma.leave.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const reimbursementsByStatus = await this.prisma.reimbursement.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const timesheetsByStatus = await this.prisma.timesheet.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    return {
      leaves: leavesByStatus,
      reimbursements: reimbursementsByStatus,
      timesheets: timesheetsByStatus,
    };
  }
}
