import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

export async function ensureDefaultAdmin(prisma: PrismaService) {
  const companyName = 'LZ Security Solutions';
  const adminNumber = 'ADMIN001';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin@123';

  const existingCompany = await prisma.company.findFirst({
    where: { name: companyName },
  });

  const company =
    existingCompany ??
    (await prisma.company.create({
      data: {
        name: companyName,
        status: 'ACTIVE',
      },
    }));

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
        email: 'admin@lzsecurity.local',
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
        address: 'Head Office',
        active: true,
      },
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

  return { company, user, employee, site };
}