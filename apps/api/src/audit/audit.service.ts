import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(data: {
    companyId: string;
    actorUserId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.auditLog.create({
      data: {
        companyId: data.companyId,
        actorUserId: data.actorUserId ?? null,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId ?? null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  }

  async listLogs(companyId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
