import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async answerAttendanceQuestion(companyId: string, question: string) {
    const normalized = question.toLowerCase();

    if (normalized.includes('clocked in')) {
      const count = await this.prisma.attendanceRecord.count({
        where: { companyId, clockOutAt: null },
      });

      return {
        answer: `There are ${count} employees currently clocked in for this company.`,
        scope: 'company',
      };
    }

    return {
      answer: 'I can summarize attendance, identify unusual patterns, and help with approved company-scoped queries.',
      scope: 'company',
    };
  }
}
