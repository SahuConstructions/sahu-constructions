import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { ActionLeaveDto } from './dto/action-leave.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  // Employee views own leaves
  async myLeaves(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) throw new ForbiddenException('Employee not found');

    return this.prisma.leave.findMany({
      where: { employeeId: employee.id },
      include: { actions: { include: { user: true } } }, // include audit trail
      orderBy: { createdAt: 'desc' },
    });
  }

  // Manager/HR fetch pending leaves
  async pending(user: any) {
    if (user.role === 'MANAGER') {
      // Manager sees only their direct reports
      const managerEmp = await this.prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      return this.prisma.leave.findMany({
        where: { employee: { managerId: managerEmp?.id } },
        include: { actions: { include: { user: true } }, employee: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  
    if (user.role === 'HR') {
      // HR sees all that reached HR stage
      return this.prisma.leave.findMany({
        where: { status: 'PendingHR' },
        include: { actions: { include: { user: true } }, employee: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  
    if (user.role === 'ADMIN') {
      // Admin sees everything
      return this.prisma.leave.findMany({
        include: { actions: { include: { user: true } }, employee: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  
    return [];
  }
  
  // Manager/HR takes action
  async action(user: any, leaveId: number, dto: ActionLeaveDto) {
    const leave = await this.prisma.leave.findUnique({
      where: { id: leaveId },
    });
    if (!leave) throw new NotFoundException('Leave not found');
  
    let newStatus: string | null = null;
    let auditAction: string | null = null;
  
    if (user.role === 'MANAGER' && leave.status === 'PendingManager') {
      newStatus =
        dto.action === 'approve' ? 'PendingHR' : 'RejectedByManager';
      auditAction = dto.action === 'approve' ? 'APPROVED_BY_MANAGER' : 'REJECTED_BY_MANAGER';
    }
  
    if (user.role === 'HR' && leave.status === 'PendingHR') {
      newStatus =
        dto.action === 'approve' ? 'Approved' : 'RejectedByHR';
      auditAction = dto.action === 'approve' ? 'APPROVED_BY_HR' : 'REJECTED_BY_HR';
    }
  
    if (user.role === 'ADMIN') {
      // Admin can override at any stage
      newStatus = dto.action === 'approve' ? 'Approved' : 'RejectedByAdmin';
      auditAction = dto.action === 'approve' ? 'APPROVED_BY_ADMIN' : 'REJECTED_BY_ADMIN';
    }
  
    if (!newStatus || !auditAction) {
      throw new ForbiddenException('You cannot act on this leave');
    }
  
    const updated = await this.prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: newStatus,
        ...(user.role === 'MANAGER' ? { managerId: user.userId } : {}),
        ...(user.role === 'HR' ? { hrId: user.userId } : {}),
      },
    });
  
    // Audit log
    await this.prisma.leaveAction.create({
      data: {
        leaveId,
        userId: user.userId,
        role: user.role,
        action: auditAction,
        comments: dto.comments,
      },
    });
  
    return updated;
  }  

  // Generate a summary report of all leaves
async getSummary() {
  const total = await this.prisma.leave.count();

  const byStatus = await this.prisma.leave.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const byType = await this.prisma.leave.groupBy({
    by: ['type'],
    _count: { _all: true },
  });

  return {
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
  };
}

  // Admin/Manager/HR fetch audit trail
  async getAudit(leaveId: number) {
    return this.prisma.leaveAction.findMany({
      where: { leaveId },
      include: { user: true }, // <-- this can fail if relation misconfigured
      orderBy: { createdAt: 'asc' },
    });
  }
  // 🔹 Calculate entitlement dynamically
  async calculateEntitlement(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");

    // Check tenure
    const joinDate = dayjs(employee.joinDate);
    const months = dayjs().diff(joinDate, "month");

    if (!employee.confirmed && months < 6) {
      // New Joiner: 6-month probation entitlement
      return { annual: 12, sick: 5, other: 0 };
    } else {
      // Confirmed employee: yearly entitlement
      return { annual: 24, sick: 5, other: 16 };
    }
  }

  // 🔹 Fetch leave balance
  async getLeaveBalance(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found");
  
    // 🧭 Check if under 6 months or confirmed
    const joinDate = new Date(employee.joinDate);
    const months = (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const isConfirmed = employee.confirmed || months >= 6;
  
    // 🧮 Entitlement logic
    const entitlement = isConfirmed
      ? { annual: 24, sick: 5, other: 16 }
      : { annual: 12, sick: 5, other: 0 };
  
    // ✅ Include all approval statuses
    const leaves = await this.prisma.leave.findMany({
      where: {
        employeeId,
        status: { in: ["Approved", "ApprovedByHR", "ApprovedByManager", "ApprovedByAdmin"] },
      },
      select: { type: true, days: true },
    });
  
    const used = { annual: 0, sick: 0, other: 0 };
  
    // Sum correctly by type
    for (const l of leaves) {
      const t = l.type.toLowerCase();
      if (t.includes("annual")) used.annual += l.days;
      else if (t.includes("sick")) used.sick += l.days;
      else used.other += l.days;
    }
  
    const remaining = {
      annual: Math.max(entitlement.annual - used.annual, 0),
      sick: Math.max(entitlement.sick - used.sick, 0),
      other: Math.max(entitlement.other - used.other, 0),
    };
  
    return {
      entitlement,
      used,
      remaining,
      confirmed: isConfirmed,
    };
  }
  async getEmployeeByUserId(userId: number) {
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) throw new NotFoundException("Employee not found");
    return emp;
  }
  
  // 👨‍💼 Manager: fetch balances of direct reports
async getManagerTeamBalances(userId: number) {
  const manager = await this.prisma.employee.findUnique({
    where: { userId },
    include: { subordinates: true },
  });
  if (!manager) throw new NotFoundException("Manager not found");

  const balances = [];
  for (const emp of manager.subordinates) {
    const balance = await this.getLeaveBalance(emp.id);
    balances.push({
      employeeId: emp.id,
      name: emp.name,
      ...balance,
    });
  }
  return balances;
}

// 👩‍💼 HR: fetch all employee balances
async getAllLeaveBalances() {
  const employees = await this.prisma.employee.findMany();
  const balances = [];

  for (const emp of employees) {
    const balance = await this.getLeaveBalance(emp.id);
    balances.push({
      employeeId: emp.id,
      name: emp.name,
      confirmed: emp.confirmed,
      ...balance,
    });
  }

  return balances;
}

  // Employee applies for leave
  async apply(userId: number, dto: any) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new ForbiddenException("Employee not found");
  
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (days <= 0) throw new ForbiddenException("Invalid date range");
  
    const balance = await this.getLeaveBalance(employee.id);
    const type = dto.type.toLowerCase();
    let remaining = 0;
  
    if (type.includes("annual")) remaining = balance.remaining.annual;
    else if (type.includes("sick")) remaining = balance.remaining.sick;
    else remaining = balance.remaining.other;
  
    if (remaining < days) {
      throw new ForbiddenException(`❌ Not enough ${dto.type} balance (Available: ${remaining})`);
    }
  
    const leave = await this.prisma.leave.create({
      data: {
        employeeId: employee.id,
        type: dto.type,
        startDate: start,
        endDate: end,
        days,
        status: "PendingManager",
      },
    });
  
    await this.prisma.leaveAction.create({
      data: {
        leaveId: leave.id,
        userId,
        role: "EMPLOYEE",
        action: "APPLY",
        comments: dto.reason,
      },
    });
  
    return leave;
  }  
  
}
