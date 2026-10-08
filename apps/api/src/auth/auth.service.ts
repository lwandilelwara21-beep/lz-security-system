import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        employeeNumber: loginDto.employeeNumber,
      },
      include: {
        role: true,
        company: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.storeRefreshToken(user.id, refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        employeeNumber: user.employeeNumber,
        email: user.email,
        companyId: user.companyId,
        role: user.role.name,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'fallback-refresh-secret',
      });

      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          userId: payload.sub,
          revokedAt: null,
        },
      });

      if (!tokenRecord) {
        throw new BadRequestException('Refresh token invalid');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true },
    });
  }

  private generateAccessToken(user: {
    id: string;
    companyId: string;
    employeeNumber?: string | null;
    email?: string | null;
    role: { name: string };
  }) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      employeeNumber: user.employeeNumber,
      email: user.email,
      role: user.role.name,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') ?? 'fallback-secret',
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m') as any,
    });
  }

  private generateRefreshToken(user: {
    id: string;
    companyId: string;
    employeeNumber?: string | null;
    email?: string | null;
    role: { name: string };
  }) {
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      employeeNumber: user.employeeNumber,
      email: user.email,
      role: user.role.name,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'fallback-refresh-secret',
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any,
    });
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });
  }
}
