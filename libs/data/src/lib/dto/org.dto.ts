import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  parentOrgId?: string;
}

export class OrgResponseDto {
  id!: string;
  name!: string;
  parentOrgId?: string;
  createdAt!: string;
  updatedAt!: string;
}
