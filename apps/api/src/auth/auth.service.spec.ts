import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rejects invalid credentials when employee does not exist', async () => {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };

        return config[key] ?? 'fallback';
      }),
    };

    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
    );

    await expect(
      service.login({ employeeNumber: 'NO_SUCH_EMPLOYEE', password: 'wrong_password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
