import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async listEmployees(
    filters: { companyId: string; active?: boolean; search?: string },
    page = 1,
    limit = 20,
  ) {
    const where: any = {
      companyId: filters.companyId,
    };

    if (typeof filters.active === 'boolean') {
      where.active = filters.active;
    }

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeNumber: { contains: search } },
      ];
    }

    const items = await this.prisma.employee.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignments: {
          where: { active: true },
          include: { site: true },
        },
      },
    });

    const total = await this.prisma.employee.count({ where });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findById(employeeId: string, companyId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
      include: {
        assignments: {
          where: { active: true },
          include: { site: true },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async createEmployee(data: {
    companyId: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    password: string;
    siteId: string;
    phoneNumber?: string | null;
    active?: boolean;
  }) {
    const exists = await this.prisma.employee.findUnique({
      where: { employeeNumber: data.employeeNumber },
    });

    if (exists) {
      throw new ConflictException('Employee number already exists');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { employeeNumber: data.employeeNumber },
    });

    if (existingUser) {
      throw new ConflictException('An account already exists for this employee number');
    }

    const site = await this.prisma.site.findFirst({
      where: {
        id: data.siteId,
        companyId: data.companyId,
        active: true,
      },
    });

    if (!site) {
      throw new BadRequestException('Select an active site for this employee');
    }

    let role = await this.prisma.role.findFirst({
      where: {
        companyId: data.companyId,
        name: 'SECURITY_OFFICER',
      },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          companyId: data.companyId,
          name: 'SECURITY_OFFICER',
          permissions: JSON.stringify({ attendance: true }),
        },
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          companyId: data.companyId,
          roleId: role.id,
          employeeNumber: data.employeeNumber,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber ?? null,
          status: 'ACTIVE',
        },
      });

      const employee = await transaction.employee.create({
        data: {
          companyId: data.companyId,
          userId: user.id,
          employeeNumber: data.employeeNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber ?? null,
          active: data.active ?? true,
        },
      });

      await transaction.siteAssignment.create({
        data: {
          companyId: data.companyId,
          employeeId: employee.id,
          siteId: site.id,
          active: true,
        },
      });

      return employee;
    });
  }

  async updateEmployee(
    employeeId: string,
    companyId: string,
    data: {
      employeeNumber?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      active?: boolean;
    },
  ) {
    const employee = await this.findById(employeeId, companyId);

    if (data.employeeNumber && data.employeeNumber !== employee.employeeNumber) {
      const existing = await this.prisma.employee.findUnique({
        where: { employeeNumber: data.employeeNumber },
      });

      if (existing) {
        throw new ConflictException('Employee number already exists');
      }
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data,
    });
  }

  async assignSite(employeeId: string, siteId: string, companyId: string) {
    const employee = await this.findById(employeeId, companyId);

    const site = await this.prisma.site.findFirst({
      where: {
        id: siteId,
        companyId,
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    const existingActiveAssignment = await this.prisma.siteAssignment.findFirst({
      where: {
        employeeId: employee.id,
        siteId,
        companyId,
        active: true,
      },
    });

    if (existingActiveAssignment) {
      return existingActiveAssignment;
    }

    await this.prisma.siteAssignment.updateMany({
      where: {
        employeeId: employee.id,
        companyId,
        active: true,
      },
      data: {
        active: false,
        removedAt: new Date(),
      },
    });

    return this.prisma.siteAssignment.create({
      data: {
        companyId,
        employeeId: employee.id,
        siteId,
        active: true,
      },
    });
  }
}
