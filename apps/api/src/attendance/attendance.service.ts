import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async clockIn(data: {
    userId: string;
    companyId: string;
    employeeNumber?: string;
    siteId?: string;
    shiftId?: string;
    latitude?: number;
    longitude?: number;
    device?: string;
  }) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { userId: data.userId, companyId: data.companyId, active: true },
          ...(data.employeeNumber
            ? [{ employeeNumber: data.employeeNumber, companyId: data.companyId, active: true }]
            : []),
        ],
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found or inactive');
    }

    const existingActiveRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        companyId: data.companyId,
        clockOutAt: null,
      },
      orderBy: {
        clockInAt: 'desc',
      },
    });

    if (existingActiveRecord) {
      throw new BadRequestException('Employee is already clocked in');
    }

    const site = await this.resolveSite(employee.id, data.companyId, data.siteId);
    const clockInAt = new Date();
    const lateFlag = this.detectLateStatus(clockInAt, data.shiftId);

    const record = await this.prisma.attendanceRecord.create({
      data: {
        companyId: data.companyId,
        employeeId: employee.id,
        siteId: site.id,
        shiftId: data.shiftId ?? null,
        clockInAt,
        status: lateFlag ? 'LATE' : 'PRESENT',
        lateFlag,
      },
    });

    await this.prisma.attendanceEvent.create({
      data: {
        attendanceRecordId: record.id,
        eventType: 'CLOCK_IN',
        eventTime: clockInAt,
        sourceDevice: data.device ?? 'web',
        gpsLatitude: data.latitude ?? null,
        gpsLongitude: data.longitude ?? null,
        status: lateFlag ? 'LATE' : 'PRESENT',
      },
    });

    return {
      id: record.id,
      employeeId: employee.id,
      siteId: site.id,
      clockInAt,
      status: record.status,
      lateFlag,
    };
  }

  async clockOut(data: {
    userId: string;
    companyId: string;
    notes?: string;
  }) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        userId: data.userId,
        companyId: data.companyId,
        active: true,
      },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found or inactive');
    }

    const activeRecord = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        companyId: data.companyId,
        clockOutAt: null,
      },
      orderBy: {
        clockInAt: 'desc',
      },
    });

    if (!activeRecord) {
      throw new BadRequestException('No active clock-in found for this employee');
    }

    const clockOutAt = new Date();
    const totalHours = this.calculateHours(activeRecord.clockInAt, clockOutAt);

    const updatedRecord = await this.prisma.attendanceRecord.update({
      where: { id: activeRecord.id },
      data: {
        clockOutAt,
        totalHours,
        notes: data.notes ?? activeRecord.notes,
        status: 'PRESENT',
      },
    });

    await this.prisma.attendanceEvent.create({
      data: {
        attendanceRecordId: updatedRecord.id,
        eventType: 'CLOCK_OUT',
        eventTime: clockOutAt,
        status: 'PRESENT',
      },
    });

    return {
      id: updatedRecord.id,
      employeeId: employee.id,
      clockInAt: updatedRecord.clockInAt,
      clockOutAt: updatedRecord.clockOutAt,
      totalHours,
      status: updatedRecord.status,
    };
  }

  async listMyHistory(userId: string, companyId: string, page = 1, limit = 20) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        userId,
        companyId,
        active: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found');
    }

    const items = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId: employee.id,
        companyId,
      },
      orderBy: {
        clockInAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        site: true,
      },
    });

    const total = await this.prisma.attendanceRecord.count({
      where: {
        employeeId: employee.id,
        companyId,
      },
    });

    return { items, total, page, limit };
  }

  private async resolveSite(employeeId: string, companyId: string, requestedSiteId?: string) {
    if (requestedSiteId) {
      const site = await this.prisma.site.findFirst({
        where: {
          id: requestedSiteId,
          companyId,
          active: true,
        },
      });

      if (!site) {
        throw new BadRequestException('Selected site is invalid for this company');
      }

      const assignment = await this.prisma.siteAssignment.findFirst({
        where: {
          employeeId,
          companyId,
          siteId: site.id,
          active: true,
        },
      });

      if (!assignment) {
        throw new BadRequestException('Employee is not assigned to the selected site');
      }

      return site;
    }

    const assignment = await this.prisma.siteAssignment.findFirst({
      where: {
        employeeId,
        companyId,
        active: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      include: {
        site: true,
      },
    });

    if (!assignment || !assignment.site) {
      throw new BadRequestException('Employee is not assigned to any active site');
    }

    return assignment.site;
  }

  private detectLateStatus(clockInAt: Date, shiftId?: string) {
    if (!shiftId) {
      return clockInAt.getHours() >= 9;
    }

    return false;
  }

  private calculateHours(start: Date | null, end: Date) {
    if (!start) {
      return 0;
    }

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  }
}
