import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus, TaskCategory } from '../enums';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    maxLength: 100
  })
  @IsString()
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Add JWT-based authentication to the API',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    required: false,
    example: TaskStatus.Backlog
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task category',
    enum: TaskCategory,
    required: false,
    example: TaskCategory.Work
  })
  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;
}

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication',
    maxLength: 100,
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Add JWT-based authentication to the API',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    required: false,
    example: TaskStatus.InProgress
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task category',
    enum: TaskCategory,
    required: false,
    example: TaskCategory.Work
  })
  @IsOptional()
  @IsEnum(TaskCategory)
  category?: TaskCategory;
}

export class TaskResponseDto {
  @ApiProperty({
    description: 'Task ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id!: string;

  @ApiProperty({
    description: 'Task title',
    example: 'Implement user authentication'
  })
  title!: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Add JWT-based authentication to the API',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.Backlog
  })
  status!: TaskStatus;

  @ApiProperty({
    description: 'Task category',
    enum: TaskCategory,
    example: TaskCategory.Work
  })
  category!: TaskCategory;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  orgId!: string;

  @ApiProperty({
    description: 'User ID who created the task',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  createdByUserId?: string;

  @ApiProperty({
    description: 'Task creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Task last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time'
  })
  updatedAt!: string;
}
