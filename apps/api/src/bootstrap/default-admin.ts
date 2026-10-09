import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export async function ensureDefaultAdmin(prisma: PrismaService) {
  const companyName = 'Imivuyo Security & Cleaning Services';
  const adminNumber = 'ADMIN001';
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (isProduction && (!configuredAdminPassword || configuredAdminPassword === 'Admin@123')) {
    throw new Error('Set DEFAULT_ADMIN_PASSWORD to a unique secret before production startup');
  }

  const adminPassword = configuredAdminPassword ?? 'Admin@123';

  let company = await prisma.company.findFirst({
    where: { name: companyName },
  });

  if (!company) {
    const legacyCompany = await prisma.company.findFirst({
      where: { name: 'LZ Security Solutions' },
    });

    company = legacyCompany
      ? await prisma.company.update({
          where: { id: legacyCompany.id },
          data: { name: companyName },
        })
      : await prisma.company.create({
          data: {
            name: companyName,
            status: 'ACTIVE',
          },
        });
  }

  const existingRole = await prisma.role.findFirst({
    where: {
      companyId: company.id,
      name: 'SUPER_ADMIN',
    },
  });

  const role =
    existingRole ??
    (await prisma.role.create({
      data: {
        companyId: company.id,
        name: 'SUPER_ADMIN',
        permissions: JSON.stringify({
          admin: true,
          manageEmployees: true,
          manageSites: true,
          manageAttendance: true,
          viewReports: true,
        }),
      },
    }));

  let user = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      employeeNumber: adminNumber,
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        companyId: company.id,
        roleId: role.id,
        employeeNumber: adminNumber,
        email: 'admin@imivuyocs.local',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        firstName: 'System',
        lastName: 'Administrator',
        status: 'ACTIVE',
      },
    });
  }

  let employee = await prisma.employee.findFirst({
    where: {
      companyId: company.id,
      employeeNumber: adminNumber,
    },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        userId: user.id,
        employeeNumber: adminNumber,
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: null,
        active: true,
      },
    });
  } else if (employee.userId !== user.id) {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });
  }

  const defaultSiteName = 'Head Office';
  const defaultSiteAddress = '6 Batting Road, Beacon Bay, East London, 5241';
  let site = await prisma.site.findFirst({
    where: {
      companyId: company.id,
      name: defaultSiteName,
    },
  });

  if (!site) {
    site = await prisma.site.create({
      data: {
        companyId: company.id,
        name: defaultSiteName,
        address: defaultSiteAddress,
        active: true,
      },
    });
  } else if (site.address !== defaultSiteAddress) {
    site = await prisma.site.update({
      where: { id: site.id },
      data: { address: defaultSiteAddress },
    });
  }

  const hasAssignment = await prisma.siteAssignment.findFirst({
    where: {
      companyId: company.id,
      employeeId: employee.id,
      siteId: site.id,
      active: true,
    },
  });

  if (!hasAssignment) {
    await prisma.siteAssignment.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        siteId: site.id,
        active: true,
      },
    });
  }

  const demoDataEnabled = !isProduction || process.env.ENABLE_DEMO_DATA === 'true';
  let demoUser;
  let demoEmployee;

  if (demoDataEnabled) {
    const configuredDemoPassword = process.env.DEFAULT_DEMO_EMPLOYEE_PASSWORD;
    if (isProduction && (!configuredDemoPassword || configuredDemoPassword === 'Officer@123')) {
      throw new Error('Set DEFAULT_DEMO_EMPLOYEE_PASSWORD before enabling production demo data');
    }

    const demoPassword = configuredDemoPassword ?? 'Officer@123';
    const officerRole =
      (await prisma.role.findFirst({
        where: { companyId: company.id, name: 'SECURITY_OFFICER' },
      })) ??
      (await prisma.role.create({
        data: {
          companyId: company.id,
          name: 'SECURITY_OFFICER',
          permissions: JSON.stringify({ attendance: true }),
        },
      }));

    demoUser = await prisma.user.findFirst({
      where: { companyId: company.id, employeeNumber: 'DEMO001' },
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          companyId: company.id,
          roleId: officerRole.id,
          employeeNumber: 'DEMO001',
          email: 'demo.officer@lzsecurity.local',
          passwordHash: await bcrypt.hash(demoPassword, 10),
          firstName: 'Demo',
          lastName: 'Officer',
          status: 'ACTIVE',
        },
      });
    }

    demoEmployee = await prisma.employee.findFirst({
      where: { companyId: company.id, employeeNumber: 'DEMO001' },
    });

    if (!demoEmployee) {
      demoEmployee = await prisma.employee.create({
        data: {
          companyId: company.id,
          userId: demoUser.id,
          employeeNumber: 'DEMO001',
          firstName: 'Demo',
          lastName: 'Officer',
          phoneNumber: null,
          active: true,
        },
      });
    } else if (demoEmployee.userId !== demoUser.id) {
      demoEmployee = await prisma.employee.update({
        where: { id: demoEmployee.id },
        data: { userId: demoUser.id },
      });
    }

    const demoHasAssignment = await prisma.siteAssignment.findFirst({
      where: {
        companyId: company.id,
        employeeId: demoEmployee.id,
        siteId: site.id,
        active: true,
      },
    });

    if (!demoHasAssignment) {
      await prisma.siteAssignment.create({
        data: {
          companyId: company.id,
          employeeId: demoEmployee.id,
          siteId: site.id,
          active: true,
        },
      });
    }
  }

  return { company, user, employee, site, demoUser, demoEmployee };
}