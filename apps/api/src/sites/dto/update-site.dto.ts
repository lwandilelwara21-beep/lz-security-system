import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  geofenceRadius?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
