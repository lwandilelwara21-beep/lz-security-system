import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  it('creates an employee login and assigns the employee to the selected site', async () => {
    const transaction = {
      user: {
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      employee: {
        create: jest.fn().mockResolvedValue({ id: 'employee-1', employeeNumber: 'EMP1001' }),
      },
      siteAssignment: {
        create: jest.fn().mockResolvedValue({ id: 'assignment-1' }),
      },
    };
    const prisma = {
      employee: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      site: {
        findFirst: jest.fn().mockResolvedValue({ id: 'site-1', active: true }),
      },
      role: {
        findFirst: jest.fn().mockResolvedValue({ id: 'role-1', name: 'SECURITY_OFFICER' }),
      },
      $transaction: jest.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)),
    };

    const service = new EmployeesService(prisma as any);
    const result = await service.createEmployee({
      companyId: 'company-1',
      employeeNumber: 'EMP1001',
      firstName: 'Sam',
      lastName: 'Officer',
      password: 'SecurePass123',
      siteId: 'site-1',
    });

    expect(result.employeeNumber).toBe('EMP1001');
    expect(transaction.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeNumber: 'EMP1001',
        roleId: 'role-1',
        passwordHash: expect.not.stringContaining('SecurePass123'),
      }),
    });
    expect(transaction.employee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', companyId: 'company-1' }),
    });
    expect(transaction.siteAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-1',
        employeeId: 'employee-1',
        siteId: 'site-1',
      }),
    });
  });

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
