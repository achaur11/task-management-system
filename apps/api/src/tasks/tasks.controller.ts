import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus, TaskCategory } from 'data';
import { Roles, OrgScoped, JwtUser, OrgScope } from 'auth';
import { Role } from 'data';

import { TasksService, TaskFilters, PaginatedTasks } from './tasks.service';
import { User } from '../entities/user.entity';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.Admin, Role.Owner)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new task',
    description: 'Create a new task. Requires Admin or Owner role.'
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Task successfully created',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/TaskResponseDto' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @JwtUser() user: User,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<{ data: TaskResponseDto }> {
    const task = await this.tasksService.create(createTaskDto, user);
    return { data: task };
  }

  @Get()
  @Roles(Role.Viewer, Role.Admin, Role.Owner)
  @OrgScoped()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all tasks',
    description: 'Get a paginated list of tasks with filtering and sorting options. Returns tasks scoped to user\'s organization.'
  })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false, description: 'Filter by task status' })
  @ApiQuery({ name: 'category', enum: TaskCategory, required: false, description: 'Filter by task category' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query for task title and description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 20)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['updatedAt', 'title', 'status'], description: 'Field to sort by (default: updatedAt)' })
  @ApiQuery({ name: 'sortDir', required: false, enum: ['asc', 'desc'], description: 'Sort direction (default: desc)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tasks retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TaskResponseDto' }
        },
        page: { type: 'number' },
        pageSize: { type: 'number' },
        total: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(
    @JwtUser() user: User,
    @OrgScope() orgScope: any,
    @Query('status') status?: TaskStatus,
    @Query('category') category?: TaskCategory,
    @Query('q') q?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
    @Query('sortBy', new DefaultValuePipe('updatedAt')) sortBy?: 'updatedAt' | 'title' | 'status',
    @Query('sortDir', new DefaultValuePipe('desc')) sortDir?: 'asc' | 'desc',
  ): Promise<{ data: TaskResponseDto[]; page: number; pageSize: number; total: number }> {
    const filters: TaskFilters = {
      status,
      category,
      q,
      page,
      pageSize,
      sortBy,
      sortDir,
    };

    const result = await this.tasksService.findAll(user, filters);
    return {
      data: result.data,
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }

  @Get(':id')
  @Roles(Role.Viewer, Role.Admin, Role.Owner)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get a task by ID',
    description: 'Get a specific task by its ID. User must have access to the task\'s organization.'
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/TaskResponseDto' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @JwtUser() user: User,
    @Param('id') id: string,
  ): Promise<{ data: TaskResponseDto }> {
    const task = await this.tasksService.findOne(id);
    
    // Additional permission check for individual task access
    const orgTree = await this.tasksService.buildOrgTree();

    // Check if user can access this specific task
    const accessibleOrgIds = this.tasksService.getAccessibleOrgIds(user, orgTree);
    if (!accessibleOrgIds.includes(task.orgId)) {
      throw new ForbiddenException('Cannot access this task');
    }

    const taskResponse = this.tasksService.mapToTaskResponse(task);
    return { data: taskResponse };
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Owner)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update a task',
    description: 'Update an existing task. Requires Admin or Owner role.'
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Task updated successfully',
    schema: {
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/TaskResponseDto' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @JwtUser() user: User,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<{ data: TaskResponseDto }> {
    const task = await this.tasksService.update(user, id, updateTaskDto);
    return { data: task };
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Owner)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete a task',
    description: 'Delete an existing task. Requires Admin or Owner role.'
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Task deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @JwtUser() user: User,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.tasksService.remove(user, id);
  }
}
