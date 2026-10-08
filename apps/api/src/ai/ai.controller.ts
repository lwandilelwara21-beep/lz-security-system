import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Post('attendance-query')
  async attendanceQuery(@Req() req: any, @Body() body: { question: string }) {
    return this.aiService.answerAttendanceQuestion(req.user.companyId, body.question ?? '');
  }
}
