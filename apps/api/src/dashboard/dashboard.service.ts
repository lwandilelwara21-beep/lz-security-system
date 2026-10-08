import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(companyId: string) {
    const [totalEmployees, activeSites, currentlyClockedIn, lateEmployees, missingClockOuts, recentActivity] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, active: true } }),
      this.prisma.site.count({ where: { companyId, active: true } }),
      this.prisma.attendanceRecord.count({
        where: { companyId, clockOutAt: null },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          companyId,
          lateFlag: true,
          clockOutAt: null,
        },
      }),
      this.prisma.attendanceRecord.count({
        where: {
          companyId,
          clockOutAt: null,
          clockInAt: { lt: new Date(Date.now() - 1000 * 60 * 60 * 12) },
        },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { companyId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        include: { employee: true, site: true },
      }),
    ]);

    return {
      totalEmployees,
      activeSites,
      currentlyClockedIn,
      lateEmployees,
      missingClockOuts,
      recentActivity,
    };
  }
}
