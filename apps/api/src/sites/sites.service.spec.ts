import { SitesService } from './sites.service';

describe('SitesService', () => {
  it('filters sites by active company scope', async () => {
    const prisma = {
      site: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const service = new SitesService(prisma as any);
    const result = await service.listSites({ companyId: 'company-1' }, 1, 10);

    expect(prisma.site.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'company-1' }),
        skip: 0,
        take: 10,
      }),
    );

    expect(result.total).toBe(0);
  });
});
