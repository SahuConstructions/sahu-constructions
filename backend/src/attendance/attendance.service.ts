import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AttendanceGateway } from './attendance.gateway';
import { UploadService } from '../uploads/upload.service';
import fetch from 'node-fetch'; // ✅ added for reverse geocoding

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private gateway: AttendanceGateway,
    private uploadService: UploadService,
  ) {}

  /**
   * Reverse geocode (lat, lon) → readable address
   */
  private async reverseGeocodeIfNeeded(location: string): Promise<string> {
    // if it's already a readable address, skip
    if (!location) return 'Unknown location';
    if (/[A-Za-z]/.test(location)) return location;

    try {
      const [lat, lon] = location.split(',').map((n) => parseFloat(n.trim()));
      if (isNaN(lat) || isNaN(lon)) return location;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { 'User-Agent': 'Sahu-Construction-App/1.0' } },
      );

      // 👇 Explicitly type JSON result
      const data = (await res.json()) as { display_name?: string };

      if (data.display_name) {
        return data.display_name;
      }
      return `${lat}, ${lon}`;
    } catch (err) {
      console.error('❌ Reverse geocoding failed:', err);
      return location;
    }
  }

  /**
 * Shorten long address strings (for mobile)
 */
private shortenAddress(address: string): string {
  if (!address) return 'Unknown location';
  // Keep only first 5 comma-separated parts, e.g. "Area, City, State, Country"
  const parts = address.split(',').map(p => p.trim());
  return parts.slice(0, 4).join(', ');
}


  /**
   * Create new attendance record
   */
  async create(userId: number, dto: CreateAttendanceDto & { selfieFilePath?: string }) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error('Employee not found');

    // ✅ Upload selfie to Cloudinary (if provided)
    let selfieUrl = dto.selfieUrl || null;
    if (dto.selfieFilePath) {
      try {
        const uploaded = await this.uploadService.uploadToCloudinary(
          dto.selfieFilePath,
          'attendance_selfies',
        );
        selfieUrl = uploaded.secure_url;
      } catch (err) {
        console.error('❌ Cloudinary upload failed:', err);
      }
    }

    // ✅ Convert lat/lon → readable address
    const fullLocation = await this.reverseGeocodeIfNeeded(dto.location);
    const readableLocation = this.shortenAddress(fullLocation);


    // ✅ Save to DB
    const saved = await this.prisma.attendance.create({
      data: {
        employeeId: employee.id,
        type: dto.type,
        timestamp: new Date(dto.timestamp),
        location: readableLocation,
        deviceId: dto.deviceId,
        selfieUrl,
      },
    });

    // ✅ Live update to HR/Admin dashboards
    this.gateway.sendNewPunch({
      ...saved,
      employee: { id: employee.id, name: employee.name },
    });

    return saved;
  }

  /**
   * Get summarized attendance data
   */
  async getSummary() {
    const total = await this.prisma.attendance.count();

    const byType = await this.prisma.attendance.groupBy({
      by: ['type'],
      _count: { _all: true },
    });

    const byEmployee = await this.prisma.attendance.groupBy({
      by: ['employeeId'],
      _count: { _all: true },
    });

    const employees = await this.prisma.employee.findMany({
      select: { id: true, name: true, user: { select: { email: true } } },
    });

    const empMap = Object.fromEntries(
      employees.map((e) => [e.id, { name: e.name, email: e.user.email }]),
    );

    return {
      total,
      byType: byType.map((t) => ({ type: t.type, count: t._count._all })),
      byEmployee: byEmployee.map((b) => ({
        employeeId: b.employeeId,
        count: b._count._all,
        ...empMap[b.employeeId],
      })),
    };
  }

  /**
   * Monthly summary for a given year
   */
  async getMonthlySummary(year: number) {
    const records = await this.prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
      include: {
        employee: { select: { id: true, name: true, user: { select: { email: true } } } },
      },
      orderBy: { timestamp: 'asc' },
    });

    const summary: Record<string, any> = {};

    for (const r of records) {
      const month = r.timestamp.toISOString().substring(0, 7);
      const key = `${r.employeeId}-${month}`;

      if (!summary[key]) {
        summary[key] = {
          employeeId: r.employeeId,
          name: r.employee.name,
          email: r.employee.user.email,
          month,
          inCount: 0,
          outCount: 0,
          total: 0,
        };
      }

      if (r.type === 'IN') summary[key].inCount += 1;
      if (r.type === 'OUT') summary[key].outCount += 1;
      summary[key].total += 1;
    }

    return Object.values(summary);
  }

  /**
   * Daily summary per month
   */
  async getDailySummary(year: number, month: number) {
    const monthStr = month.toString().padStart(2, '0');
    const startDate = new Date(`${year}-${monthStr}-01`);
    const endDate = new Date(`${year}-${monthStr}-31`);

    const records = await this.prisma.attendance.findMany({
      where: {
        timestamp: { gte: startDate, lt: endDate },
      },
      include: {
        employee: { select: { id: true, name: true, user: { select: { email: true } } } },
      },
      orderBy: { timestamp: 'asc' },
    });

    const summary: Record<string, any> = {};

    for (const r of records) {
      const date = r.timestamp.toISOString().substring(0, 10);
      const key = `${r.employeeId}-${date}`;

      if (!summary[key]) {
        summary[key] = {
          employeeId: r.employeeId,
          name: r.employee.name,
          email: r.employee.user.email,
          date,
          inCount: 0,
          outCount: 0,
          total: 0,
        };
      }

      if (r.type === 'IN') summary[key].inCount += 1;
      if (r.type === 'OUT') summary[key].outCount += 1;
      summary[key].total += 1;
    }

    return Object.values(summary);
  }

  /**
   * Employee monthly summary
   */
  async getEmployeeSummary(year: number, month: number) {
    const monthStr = month.toString().padStart(2, '0');
    const startDate = new Date(`${year}-${monthStr}-01`);
    const endDate = new Date(`${year}-${monthStr}-31`);

    const employees = await this.prisma.employee.findMany({
      include: { user: true },
    });

    const leaves = await this.prisma.leave.findMany({
      where: { startDate: { gte: startDate, lt: endDate } },
    });

    const attendance = await this.prisma.attendance.findMany({
      where: { timestamp: { gte: startDate, lt: endDate } },
    });

    const daysInMonth = new Date(year, month, 0).getDate();

    return employees.map((emp) => {
      const empAttendance = attendance.filter((a) => a.employeeId === emp.id);
      const empLeaves = leaves.filter((l) => l.employeeId === emp.id);

      const leaveDays = empLeaves.reduce((sum, l) => sum + l.days, 0);
      const weeklyOffs = Math.floor(daysInMonth / 7);
      const daysWorked = new Set(
        empAttendance.map((a) => a.timestamp.toISOString().substring(0, 10)),
      ).size;

      return {
        employeeId: emp.id,
        name: emp.name,
        email: emp.user.email,
        daysWorked,
        leaveDays,
        weeklyOffs,
        totalWorkingDays: daysInMonth - leaveDays - weeklyOffs,
      };
    });
  }

  /**
   * Detailed attendance view for one employee (month view)
   */
  async getEmployeeDetail(employeeId: number, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const attendance = await this.prisma.attendance.findMany({
      where: { employeeId, timestamp: { gte: start, lte: end } },
      orderBy: { timestamp: 'asc' },
    });

    const days: Record<string, any> = {};

    attendance.forEach((a) => {
      const date = a.timestamp.toISOString().substring(0, 10);
      if (!days[date]) days[date] = { in: null, out: null };
      if (a.type === 'IN' && !days[date].in) days[date].in = a;
      if (a.type === 'OUT') days[date].out = a;
    });

    return Object.entries(days).map(([date, record]) => {
      let hours = 0;
      if (record.in?.timestamp && record.out?.timestamp) {
        hours =
          (record.out.timestamp.getTime() - record.in.timestamp.getTime()) /
          (1000 * 60 * 60);
      }

      return {
        date,
        inTime: record.in?.timestamp || null,
        inLocation: record.in?.location || null,
        inSelfie: record.in?.selfieUrl || null,
        outTime: record.out?.timestamp || null,
        outLocation: record.out?.location || null,
        outSelfie: record.out?.selfieUrl || null,
        hours: Number(hours.toFixed(2)),
      };
    });
  }

  /**
   * Get all attendance records for a logged-in employee
   */
  async findByEmployee(userId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new Error('Employee not found');

    return this.prisma.attendance.findMany({
      where: { employeeId: employee.id },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        type: true,
        timestamp: true,
        location: true,
        selfieUrl: true,
      },
    });
  }

  async getManagerAttendanceView(userId: number, date?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
  
    if (!user?.employee) {
      throw new Error("Manager is not linked to an employee record.");
    }
  
    const managerId = user.employee.id;
  
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
  
    const employees = await this.prisma.employee.findMany({
      where: { managerId },
      include: {
        attendances: {
          where: { timestamp: { gte: startOfDay, lte: endOfDay } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  
    const summary = { present: 0, late: 0, absent: 0 };
  
    const data = employees.map((emp) => {
      const records = emp.attendances;
      let status = 'Absent';
      let inTime: Date | null = null;
      let outTime: Date | null = null;
      let inSelfie: string | null = null;
      let outSelfie: string | null = null;
      let hours: string | null = null;

      if (records.length > 0) {
        const first = records[0];
        const last = records[records.length - 1];

        inTime = new Date(first.timestamp);
        outTime = records.length > 1 ? new Date(last.timestamp) : null;
        inSelfie = first.selfieUrl || null;
        outSelfie = last.selfieUrl || null;

        // determine threshold from employee.inTime (HH:mm) or default 10:00
        let thresholdHour = 10;
        let thresholdMinute = 0;
        if ((emp as any).inTime && typeof (emp as any).inTime === 'string') {
          const [hh, mm] = ((emp as any).inTime as string).split(':').map((n) => parseInt(n, 10));
          if (!isNaN(hh)) thresholdHour = hh;
          if (!isNaN(mm)) thresholdMinute = mm;
        }
        const checkInMinutes = inTime.getHours() * 60 + inTime.getMinutes();
        const thresholdMinutes = thresholdHour * 60 + thresholdMinute;
        if (checkInMinutes > thresholdMinutes) {
          status = 'Late';
          summary.late++;
        } else {
          status = 'Present';
        }

        summary.present++;

        if (inTime && outTime) {
          const diffMs = outTime.getTime() - inTime.getTime();
          hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        }
      } else {
        summary.absent++;
      }

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        status,
        inTime,
        outTime,
        hours,
        inSelfie,
        outSelfie,
        location: records[0]?.location || '-',
      };
    });
 
    return { summary, data };
  }

  /**
   * HR view: Attendance across all employees for a given date
   */
  async getHRAttendanceView(date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const employees = await this.prisma.employee.findMany({
      include: {
        attendances: {
          where: { timestamp: { gte: startOfDay, lte: endOfDay } },
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    const summary = { present: 0, late: 0, absent: 0 };

    const data = employees.map((emp) => {
      const records = emp.attendances;
      let status = 'Absent';
      let inTime: Date | null = null;
      let outTime: Date | null = null;
      let inSelfie: string | null = null;
      let outSelfie: string | null = null;
      let hours: string | null = null;

      if (records.length > 0) {
        const first = records[0];
        const last = records[records.length - 1];

        inTime = new Date(first.timestamp);
        outTime = records.length > 1 ? new Date(last.timestamp) : null;
        inSelfie = first.selfieUrl || null;
        outSelfie = last.selfieUrl || null;

        // determine threshold from employee.inTime (HH:mm) or default 10:00
        let thresholdHour = 10;
        let thresholdMinute = 0;
        if ((emp as any).inTime && typeof (emp as any).inTime === 'string') {
          const [hh, mm] = ((emp as any).inTime as string).split(':').map((n) => parseInt(n, 10));
          if (!isNaN(hh)) thresholdHour = hh;
          if (!isNaN(mm)) thresholdMinute = mm;
        }
        const checkInMinutes = inTime.getHours() * 60 + inTime.getMinutes();
        const thresholdMinutes = thresholdHour * 60 + thresholdMinute;
        if (checkInMinutes > thresholdMinutes) {
          status = 'Late';
          summary.late++;
        } else {
          status = 'Present';
        }

        summary.present++;

        if (inTime && outTime) {
          const diffMs = outTime.getTime() - inTime.getTime();
          hours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        }
      } else {
        summary.absent++;
      }

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        status,
        inTime,
        outTime,
        hours,
        inSelfie,
        outSelfie,
        location: records[0]?.location || '-',
      };
    });

    return { summary, data };
  }
  
}
