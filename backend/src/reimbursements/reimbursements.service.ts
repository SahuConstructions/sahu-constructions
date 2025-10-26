import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ReimbursementsService {
  constructor(private prisma: PrismaService) {}

  // 👤 Employee submits reimbursement
  async create(
    userId: number,
    dto: { amount: number; description?: string; receiptUrl?: string },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.reimbursement.create({
      data: {
        employeeId: employee.id,
        amount: dto.amount,
        description: dto.description,
        receiptUrl: dto.receiptUrl,
        status: 'PENDING_MANAGER', // 👈 first stage
      },
    });
  }

  // 👤 Employee’s own reimbursements
  async getMyReimbursements(userId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) throw new NotFoundException(`Employee not found for userId ${userId}`);

    return this.prisma.reimbursement.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
      include: { actions: { include: { user: true } } },
    });
  }

  // 👩‍💼 Role-based filtering for Manager / HR / Finance
  async listAll(user?: any) {
    const where: any = {};

    if (user?.role === 'MANAGER') where.status = 'PENDING_MANAGER';
    else if (user?.role === 'HR') where.status = 'PENDING_HR';
    else if (user?.role === 'FINANCE') where.status = 'PENDING_FINANCE';

    return this.prisma.reimbursement.findMany({
      where,
      include: {
        employee: true,
        resolvedBy: true,
        actions: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔁 Multi-level approval / rejection
  async resolve(
    id: number,
    userId: number,
    status: 'APPROVED' | 'REJECTED',
    notes?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const reimbursement = await this.prisma.reimbursement.findUnique({ where: { id } });
    if (!reimbursement) throw new NotFoundException('Reimbursement not found');

    const { role } = user;
    const current = reimbursement.status;
    let newStatus = current;

    // 🔒 Enforce correct stage actions
    if (status === 'REJECTED') {
      newStatus = 'REJECTED';
    } else {
      switch (role) {
        case Role.MANAGER:
          if (current !== 'PENDING_MANAGER')
            throw new ForbiddenException('Only pending manager items can be approved by a manager');
          newStatus = 'PENDING_HR';
          break;

        case Role.HR:
          if (current !== 'PENDING_HR')
            throw new ForbiddenException('Only pending HR items can be approved by HR');
          newStatus = 'PENDING_FINANCE';
          break;

        case Role.FINANCE:
          if (current !== 'PENDING_FINANCE')
            throw new ForbiddenException('Only pending finance items can be approved by finance');
          newStatus = 'APPROVED';
          break;

        default:
          throw new ForbiddenException('User not authorized to approve reimbursements');
      }
    }

    // 💾 Update reimbursement record
    const updated = await this.prisma.reimbursement.update({
      where: { id },
      data: {
        status: newStatus,
        resolvedById: userId,
        resolvedAt: new Date(),
        notes,
      },
    });

    // 🧾 Log action
    await this.prisma.reimbursementAction.create({
      data: {
        reimbursementId: id,
        userId,
        action:
          status === 'APPROVED'
            ? `Approved (${role})`
            : `Rejected (${role})`,
        notes,
      },
    });

    return updated;
  }

  // 📜 History
  async getHistory(id: number) {
    return this.prisma.reimbursementAction.findMany({
      where: { reimbursementId: id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔍 Single reimbursement
  async getById(id: number) {
    return this.prisma.reimbursement.findUnique({ where: { id } });
  }
}
