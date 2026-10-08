import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function ensureDefaultAdmin(prisma: PrismaService) {
  const companyName = 'LZ Security Solutions';
  const adminNumber = 'ADMIN001';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Admin@123';

  const existingCompany = await prisma.company.findFirst({
    where: { name: companyName },
  });

  const company = existingCompany ?? (await prisma.company.create({
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

  const role = existingRole ?? (await prisma.role.create({
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

  const existingUser = await prisma.user.findFirst({
    where: {
      companyId: company.id,
      employeeNumber: adminNumber,
    },
  });

  if (!existingUser) {
    await prisma.user.create({
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
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const prisma = app.get(PrismaService);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await ensureDefaultAdmin(prisma);

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);
}

bootstrap();
