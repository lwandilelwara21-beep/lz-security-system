import { ensureDefaultAdmin } from './default-admin';

describe('ensureDefaultAdmin', () => {
  it('requires an explicit non-default administrator password in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    process.env.NODE_ENV = 'production';
    delete process.env.DEFAULT_ADMIN_PASSWORD;

    try {
      await expect(ensureDefaultAdmin({} as any)).rejects.toThrow(
        'Set DEFAULT_ADMIN_PASSWORD to a unique secret before production startup',
      );
    } finally {
      process.env.NODE_ENV = previousNodeEnv;
      if (previousAdminPassword === undefined) {
        delete process.env.DEFAULT_ADMIN_PASSWORD;
      } else {
        process.env.DEFAULT_ADMIN_PASSWORD = previousAdminPassword;
      }
    }
  });

  it('creates a linked employee and default site for the admin user', async () => {
    const prisma = {
      company: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'company-1', name: 'LZ Security Solutions' }),
      },
      role: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'role-1', companyId: 'company-1', name: 'SUPER_ADMIN' }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'user-1', companyId: 'company-1', employeeNumber: 'ADMIN001' }),
      },
      employee: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1', userId: 'user-1', employeeNumber: 'ADMIN001' }),
        update: jest.fn().mockResolvedValue({ id: 'employee-1', userId: 'user-1' }),
      },
      site: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'site-1', companyId: 'company-1', name: 'Head Office' }),
      },
      siteAssignment: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'assignment-1', employeeId: 'employee-1', siteId: 'site-1' }),
      },
    };

    await ensureDefaultAdmin(prisma as any);

    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          userId: 'user-1',
          employeeNumber: 'ADMIN001',
        }),
      }),
    );
    expect(prisma.site.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          name: 'Head Office',
        }),
      }),
    );
    expect(prisma.siteAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          employeeId: 'employee-1',
          siteId: 'site-1',
          active: true,
        }),
      }),
    );
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeNumber: 'DEMO001',
          email: 'demo.officer@lzsecurity.local',
        }),
      }),
    );
  });
});
