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
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto, TaskStatus, TaskCategory } from 'data';
import { Roles, OrgScoped, JwtUser, OrgScope } from 'auth';
import { Role } from 'data';

import { TasksService, TaskFilters, PaginatedTasks } from './tasks.service';
import { User } from '../entities/user.entity';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.Admin, Role.Owner)
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
  async remove(
    @JwtUser() user: User,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    return this.tasksService.remove(user, id);
  }
}
