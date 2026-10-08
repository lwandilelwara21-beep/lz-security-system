import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  employeeNumber!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
