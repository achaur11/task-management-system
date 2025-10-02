import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email'
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 8
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
    maxLength: 50
  })
  @IsString()
  @MaxLength(50)
  displayName!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  orgId!: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    required: false,
    example: Role.Viewer
  })
  role?: Role;
}
