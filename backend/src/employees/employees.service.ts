import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: { user: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async createEmployee(dto: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    managerId?: number;
    basicSalary?: number;
    hra?: number;
    otherAllowance?: number;
    pf?: number;
    pt?: number;
    designation?: string;
    department?: string;
    location?: string;
    dob?: Date;
    pfNumber?: string;
    uan?: string;
    joinDate?: Date;
    inTime?: string;
    outTime?: string;
  }) {
    const allowedRoles: Role[] = ['USER', 'MANAGER', 'HR', 'ADMIN'];
    const requestedRole = dto.role ? dto.role.toUpperCase() : 'USER';

    if (!allowedRoles.includes(requestedRole as Role)) {
      throw new BadRequestException(
        `Invalid role. Allowed values: ${allowedRoles.join(', ')}`
      );
    }

    // ✅ Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists. Please use a unique email.');
    }

    // ✅ Generate and hash temporary password
    const tempPasswordPlain = 'SC@' + Math.floor(1000 + Math.random() * 9000);
    const hashedTemp = await bcrypt.hash(tempPasswordPlain, 10);

    // ✅ Create User
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedTemp,
        tempPassword: hashedTemp,
        role: requestedRole as Role,
      },
    });

    // ✅ Create Employee with salary structure fields
    const employee = await this.prisma.employee.create({
      data: {
        userId: user.id,
        name: dto.name,
        phone: dto.phone,
        managerId: dto.managerId || null,
        basicSalary: dto.basicSalary || 0,
        hra: dto.hra || 0,
        otherAllowance: dto.otherAllowance || 0,
        pf: dto.pf || 0,
        pt: dto.pt || 0,
        designation: dto.designation || null,
        department: dto.department || null,
        location: dto.location || null,
        dob: dto.dob ? new Date(dto.dob) : null,
        pfNumber: dto.pfNumber || null,
        uan: dto.uan || null,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
        inTime: dto.inTime || null,
        outTime: dto.outTime || null,
      },
    });

    return {
      ok: true,
      message: '✅ Employee created successfully',
      employee,
      credentials: {
        email: user.email,
        tempPassword: tempPasswordPlain,
      },
    };
  }

  async updateEmployee(id: number, dto: any) {
    return this.prisma.employee.update({
      where: { id },
      data: dto,
    });
  }

  async removeEmployee(id: number) {
    // ✅ Fetch employee to get userId
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    // ✅ Delete related records first (cascading delete)
    await this.prisma.$transaction([
      // Delete attendance records
      this.prisma.attendance.deleteMany({
        where: { employeeId: id },
      }),
      // Delete leave records
      this.prisma.leave.deleteMany({
        where: { employeeId: id },
      }),
      // Delete timesheet records
      this.prisma.timesheet.deleteMany({
        where: { employeeId: id },
      }),
      // Delete salary records
      this.prisma.employeeSalary.deleteMany({
        where: { employeeId: id },
      }),
      // Delete reimbursement records
      this.prisma.reimbursement.deleteMany({
        where: { employeeId: id },
      }),
      // Delete payroll line items
      this.prisma.payrollLineItem.deleteMany({
        where: { employeeId: id },
      }),
      // Delete the employee
      this.prisma.employee.delete({
        where: { id },
      }),
      // Delete the associated user
      this.prisma.user.delete({
        where: { id: employee.userId },
      }),
    ]);

    return {
      ok: true,
      message: '✅ Employee and all related records deleted successfully',
    };
  }

  async resetEmployeePassword(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) throw new BadRequestException('Employee not found');

    const tempPasswordPlain = 'SC@' + Math.floor(1000 + Math.random() * 9000);
    const hashedTemp = await bcrypt.hash(tempPasswordPlain, 10);

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: hashedTemp,
        tempPassword: hashedTemp,
      },
    });

    return {
      ok: true,
      message: 'Temporary password generated successfully.',
      employee: employee.name,
      email: employee.user.email,
      tempPassword: tempPasswordPlain,
    };
  }
}
