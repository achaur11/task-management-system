import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { TaskStatus, TaskCategory } from '../enums';

export class CreateTaskDto {
  @IsString()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;
}

export class TaskResponseDto {
  id!: string;
  title!: string;
  description?: string;
  status!: TaskStatus;
  category!: TaskCategory;
  orgId!: string;
  createdByUserId?: string;
  createdAt!: string;
  updatedAt!: string;
}
