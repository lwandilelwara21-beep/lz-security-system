import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSites(
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
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.site.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.site.count({ where });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findById(siteId: string, companyId: string) {
    const site = await this.prisma.site.findFirst({
      where: {
        id: siteId,
        companyId,
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found');
    }

    return site;
  }

  async createSite(data: {
    companyId: string;
    name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    geofenceRadius?: number | null;
    active?: boolean;
  }) {
    const exists = await this.prisma.site.findFirst({
      where: {
        companyId: data.companyId,
        name: data.name,
      },
    });

    if (exists) {
      throw new ConflictException('Site already exists');
    }

    return this.prisma.site.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        address: data.address ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        geofenceRadius: data.geofenceRadius ?? 100,
        active: data.active ?? true,
      },
    });
  }

  async updateSite(
    siteId: string,
    companyId: string,
    data: {
      name?: string;
      address?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      geofenceRadius?: number | null;
      active?: boolean;
    },
  ) {
    await this.findById(siteId, companyId);

    return this.prisma.site.update({
      where: { id: siteId },
      data,
    });
  }
}
