import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { Role } from '../enums';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MaxLength(50)
  displayName!: string;

  @IsString()
  orgId!: string;

  role?: Role;
}
