import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateMonthlyReport(companyId: string, month: string) {
    const targetDate = new Date(month);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const items = await this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        clockInAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        employee: true,
        site: true,
      },
      orderBy: { clockInAt: 'asc' },
    });

    const totalHours = items.reduce((sum, record) => sum + Number(record.totalHours ?? 0), 0);

    return {
      month,
      totalRecords: items.length,
      totalHours,
      items: items.map((record) => ({
        id: record.id,
        employee: `${record.employee.firstName} ${record.employee.lastName}`,
        employeeNumber: record.employee.employeeNumber,
        site: record.site?.name ?? 'Unassigned',
        date: record.clockInAt,
        clockIn: record.clockInAt,
        clockOut: record.clockOutAt,
        hoursWorked: record.totalHours ?? 0,
        lateStatus: record.lateFlag ? 'Late' : 'On time',
        attendanceStatus: record.status,
      })),
    };
  }
}
