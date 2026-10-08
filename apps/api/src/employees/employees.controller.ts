import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Get()
  async listEmployees(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    return this.employeesService.listEmployees(
      {
        companyId: req.user.companyId,
        search,
        active: active === undefined ? undefined : active === 'true',
      },
      Number(page),
      Number(limit),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Post()
  async createEmployee(@Req() req: any, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.createEmployee({
      ...dto,
      companyId: req.user.companyId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Get(':id')
  async findEmployee(@Req() req: any, @Param('id') id: string) {
    return this.employeesService.findById(id, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Patch(':id')
  async updateEmployee(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeesService.updateEmployee(id, req.user.companyId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Post(':id/assign-site')
  async assignSite(@Req() req: any, @Param('id') id: string, @Body() body: { siteId: string }) {
    return this.employeesService.assignSite(id, body.siteId, req.user.companyId);
  }
}
