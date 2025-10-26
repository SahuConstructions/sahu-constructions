import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TimesheetsService {
  constructor(private prisma: PrismaService) {}

  // 🟢 Employee: create timesheet (auto-calculate hours)
  async create(
    userId: number,
    data: { project: string; task: string; hours?: number; date: Date }
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error("Employee not found");

    // 1️⃣ Try to calculate hours from attendance data
    const startOfDay = new Date(data.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { timestamp: "asc" },
    });

    let autoHours = 0;
    if (attendance.length >= 2) {
      const firstIn = attendance.find((a) => a.type === "IN") || attendance[0];
      const lastOut = attendance.reverse().find((a) => a.type === "OUT") || attendance[attendance.length - 1];
      autoHours =
        (new Date(lastOut.timestamp).getTime() -
          new Date(firstIn.timestamp).getTime()) /
        (1000 * 60 * 60);
      autoHours = Math.max(0, Number(autoHours.toFixed(2)));
    }

    const finalHours = autoHours > 0 ? autoHours : data.hours ?? 0;

    // 2️⃣ Create timesheet record
    return this.prisma.timesheet.create({
      data: {
        employeeId: employee.id,
        project: data.project,
        task: data.task,
        hours: finalHours,
        date: data.date,
        status: "PendingManager",
      },
    });
  }

  // 🔵 Employee: view own timesheets
  async getMyTimesheets(userId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error("Employee not found");

    return this.prisma.timesheet.findMany({
      where: { employeeId: employee.id },
      orderBy: { date: "desc" },
    });
  }

  // 🟣 Manager/HR/Admin: all timesheets
  async getAllTimesheets() {
    return this.prisma.timesheet.findMany({
      include: {
        employee: { select: { id: true, name: true, user: { select: { email: true } } } },
      },
      orderBy: { date: "desc" },
    });
  }

  // 🔶 Workforce summary for month (uses attendance hours)
  async getMonthlySummary(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    // ✅ Get all employees
    const employees = await this.prisma.employee.findMany({
      include: { user: { select: { email: true } } },
    });

    // ✅ Get attendance for month
    const attendance = await this.prisma.attendance.findMany({
      where: { timestamp: { gte: start, lte: end } },
    });

    // ✅ Get leaves for month
    const leaves = await this.prisma.leave.findMany({
      where: {
        startDate: { gte: start, lte: end },
        status: { in: ["Approved", "ApprovedByHR", "ApprovedByManager", "ApprovedByAdmin"] },
      },
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    const summary = employees.map((emp) => {
      const empAttendance = attendance.filter((a) => a.employeeId === emp.id);

      // group by day
      const dates = Array.from(new Set(empAttendance.map((a) =>
        a.timestamp.toISOString().substring(0, 10)
      )));

      let totalHours = 0;

      for (const date of dates) {
        const records = empAttendance.filter((a) =>
          a.timestamp.toISOString().startsWith(date)
        );
        if (records.length >= 2) {
          const firstIn = records.find((r) => r.type === "IN") || records[0];
          const lastOut = [...records].reverse().find((r) => r.type === "OUT") || records[records.length - 1];
          const diff = (lastOut.timestamp.getTime() - firstIn.timestamp.getTime()) / (1000 * 60 * 60);
          totalHours += diff > 0 ? diff : 0;
        }
      }

      const leaveDays = leaves
        .filter((l) => l.employeeId === emp.id)
        .reduce((sum, l) => sum + l.days, 0);

      return {
        employeeId: emp.id,
        name: emp.name,
        email: emp.user.email,
        daysWorked: dates.length,
        totalHours: Number(totalHours.toFixed(2)),
        leaveDays,
        totalWorkingDays: daysInMonth,
        absentDays: Math.max(daysInMonth - dates.length - leaveDays, 0),
      };
    });

    return summary;
  }

  // 🟢 Timesheet approval flow
  async takeAction(user, id: number, action: string, comments?: string) {
    const ts = await this.prisma.timesheet.findUnique({ where: { id } });
    if (!ts) throw new NotFoundException("Timesheet not found");

    let newStatus = ts.status;

    if (user.role === "MANAGER") {
      if (ts.status !== "PendingManager") throw new ForbiddenException("Already reviewed by manager");
      newStatus = action === "approve" ? "PendingHR" : "RejectedByManager";
    } else if (user.role === "HR") {
      if (ts.status !== "PendingHR") throw new ForbiddenException("Already processed by HR");
      newStatus = action === "approve" ? "Approved" : "RejectedByHR";
    } else if (user.role === "ADMIN") {
      newStatus = action === "override" ? "Overridden" : ts.status;
    }

    return this.prisma.timesheet.update({
      where: { id },
      data: {
        status: newStatus,
        comments,
        reviewedById: user.userId,
      },
    });
  }

  // 🔹 Get daily hours from attendance (for timesheet auto-fill)
async getDailyHours(userId: number, date: string) {
  const employee = await this.prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new NotFoundException("Employee not found");

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  // Fetch all attendance entries for this employee on that date
  const records = await this.prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      timestamp: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { timestamp: "asc" },
  });

  if (records.length === 0) return { hours: 0 };

  // Find earliest IN and latest OUT
  const firstIn = records.find((r) => r.type === "IN") || records[0];
  const lastOut =
    [...records].reverse().find((r) => r.type === "OUT") ||
    records[records.length - 1];

  if (!firstIn || !lastOut) return { hours: 0 };

  const diff =
    (lastOut.timestamp.getTime() - firstIn.timestamp.getTime()) /
    (1000 * 60 * 60);

  const hours = Math.max(0, Number(diff.toFixed(2)));

  return { hours };
}
  
}
