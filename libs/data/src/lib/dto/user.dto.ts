import { IsEmail, IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Role } from '../enums';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  displayName!: string;

  @IsString()
  orgId!: string;

  @IsEnum(Role)
  role!: Role;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  displayName!: string;
  orgId!: string;
  role!: Role;
  createdAt!: string;
  updatedAt!: string;
}
