import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR', 'SECURITY_OFFICER')
  @Post('clock-in')
  async clockIn(@Req() req: any, @Body() dto: ClockInDto) {
    return this.attendanceService.clockIn({
      userId: req.user.id,
      companyId: req.user.companyId,
      siteId: dto.siteId,
      shiftId: dto.shiftId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      device: dto.device,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR', 'SECURITY_OFFICER')
  @Post('clock-out')
  async clockOut(@Req() req: any, @Body() dto: ClockOutDto) {
    return this.attendanceService.clockOut({
      userId: req.user.id,
      companyId: req.user.companyId,
      notes: dto.notes,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR', 'SECURITY_OFFICER')
  @Get('my-history')
  async myHistory(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.attendanceService.listMyHistory(req.user.id, req.user.companyId, Number(page), Number(limit));
  }
}
