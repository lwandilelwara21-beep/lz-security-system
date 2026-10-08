import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  employeeNumber!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
