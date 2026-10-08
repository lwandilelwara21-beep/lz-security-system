import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

describe('AttendanceService', () => {
  it('rejects a duplicate clock-in for an already active attendance record', async () => {
    const prisma = {
      employee: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'emp-1',
          companyId: 'company-1',
          active: true,
        }),
      },
      siteAssignment: {
        findFirst: jest.fn().mockResolvedValue({ siteId: 'site-1' }),
      },
      attendanceRecord: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'attendance-1',
          clockOutAt: null,
          clockInAt: new Date(),
        }),
        create: jest.fn(),
      },
      attendanceEvent: {
        create: jest.fn(),
      },
    };

    const service = new AttendanceService(prisma as any);

    await expect(
      service.clockIn({
        userId: 'user-1',
        companyId: 'company-1',
        employeeNumber: 'E-001',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects clock-out when no active attendance record exists', async () => {
    const prisma = {
      employee: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'emp-1',
          companyId: 'company-1',
          active: true,
        }),
      },
      attendanceRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new AttendanceService(prisma as any);

    await expect(
      service.clockOut({
        userId: 'user-1',
        companyId: 'company-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
