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
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Get()
  async listSites(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('active') active?: string,
  ) {
    return this.sitesService.listSites(
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
  async createSite(@Req() req: any, @Body() dto: CreateSiteDto) {
    return this.sitesService.createSite({
      ...dto,
      companyId: req.user.companyId,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Get(':id')
  async findSite(@Req() req: any, @Param('id') id: string) {
    return this.sitesService.findById(id, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN', 'SITE_SUPERVISOR')
  @Patch(':id')
  async updateSite(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.sitesService.updateSite(id, req.user.companyId, dto);
  }
}
