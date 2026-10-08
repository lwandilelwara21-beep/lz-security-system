import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  it('builds a safe employee list query for a company scope', async () => {
    const prisma = {
      employee: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const service = new EmployeesService(prisma as any);
    const result = await service.listEmployees({ companyId: 'company-1' }, 1, 10);

    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    );

    expect(result.total).toBe(0);
  });
});
