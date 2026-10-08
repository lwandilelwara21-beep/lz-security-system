import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Get('monthly')
  async monthly(@Req() req: any, @Query('month') month: string) {
    const resolvedMonth = month ?? new Date().toISOString().slice(0, 7);
    return this.reportsService.generateMonthlyReport(req.user.companyId, resolvedMonth);
  }
}
