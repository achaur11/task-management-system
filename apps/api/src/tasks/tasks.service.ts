import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';

import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { CreateTaskDto, UpdateTaskDto, TaskResponseDto } from 'data';
import { TaskStatus, TaskCategory } from 'data';
import { AuditAction } from 'data';
import { AuditService } from '../audit/audit.service';
import {
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  TaskPermissionContext,
} from 'auth';

export interface TaskFilters {
  status?: TaskStatus;
  category?: TaskCategory;
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'updatedAt' | 'title' | 'status';
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedTasks {
  data: TaskResponseDto[];
  page: number;
  pageSize: number;
  total: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<TaskResponseDto> {
    // Get organization tree for permission checking
    const orgTree = await this.buildOrgTree();

    // Check permissions
    const context: TaskPermissionContext = {
      user,
      targetOrgId: user.orgId, // Tasks are created in user's org
      orgTree,
    };

    if (!canCreateTask(context)) {
      throw new ForbiddenException('Cannot create tasks in this organization');
    }

    // Create task
    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || TaskStatus.Backlog,
      category: createTaskDto.category || TaskCategory.Work,
      orgId: user.orgId, // Always create in user's org
      createdByUserId: user.id,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log audit
    await this.auditService.logTaskAction(
      user.id,
      AuditAction.CREATE,
      savedTask.id,
      {
        title: savedTask.title,
        status: savedTask.status,
        category: savedTask.category,
      },
    );

    return this.mapToTaskResponse(savedTask);
  }

  async findAll(user: User, filters: TaskFilters): Promise<PaginatedTasks> {
    try {
      // For now, just get tasks for the user's organization to isolate the issue
      const accessibleOrgIds = [user.orgId];

      // Build query
      const queryBuilder = this.taskRepository
        .createQueryBuilder('task')
        .where('task.orgId IN (:...accessibleOrgIds)', { accessibleOrgIds });

      // Apply filters
      if (filters.status) {
        queryBuilder.andWhere('task.status = :status', { status: filters.status });
      }

      if (filters.category) {
        queryBuilder.andWhere('task.category = :category', { category: filters.category });
      }

      if (filters.q) {
        queryBuilder.andWhere(
          '(task.title ILIKE :search OR task.description ILIKE :search)',
          { search: `%${filters.q}%` },
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'updatedAt';
      const sortDir = filters.sortDir || 'desc';
      queryBuilder.orderBy(`task.${sortBy}`, sortDir.toUpperCase() as 'ASC' | 'DESC');

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const skip = (page - 1) * pageSize;

      queryBuilder.skip(skip).take(pageSize);

      // Execute query
      const [tasks, total] = await queryBuilder.getManyAndCount();

      return {
        data: tasks.map(task => this.mapToTaskResponse(task)),
        page,
        pageSize,
        total,
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(user: User, id: string, updateTaskDto: UpdateTaskDto): Promise<TaskResponseDto> {
    try {
      // Get task
      const task = await this.findOne(id);

      // Simple permission check - user can only update tasks in their own org
      if (task.orgId !== user.orgId) {
        throw new ForbiddenException('Cannot update this task');
      }

      // Update task
      const updatedTask = await this.taskRepository.save({
        ...task,
        ...updateTaskDto,
      });

      // Log audit
      await this.auditService.logTaskAction(
        user.id,
        AuditAction.UPDATE,
        task.id,
        {
          changes: updateTaskDto,
          previousStatus: task.status,
          previousTitle: task.title,
        },
      );

      return this.mapToTaskResponse(updatedTask);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async remove(user: User, id: string): Promise<{ success: boolean }> {
    try {
      // Get task
      const task = await this.findOne(id);

      // Simple permission check - user can only delete tasks in their own org
      if (task.orgId !== user.orgId) {
        throw new ForbiddenException('Cannot delete this task');
      }

      // Store task info before deletion for audit
      const taskInfo = {
        id: task.id,
        title: task.title,
        status: task.status,
        category: task.category,
      };

      // Delete task
      await this.taskRepository.remove(task);

      // Log audit
      await this.auditService.logTaskAction(
        user.id,
        AuditAction.DELETE,
        taskInfo.id,
        {
          title: taskInfo.title,
          status: taskInfo.status,
          category: taskInfo.category,
        },
      );

      return { success: true };
    } catch (error) {
      console.error('Error in remove:', error);
      throw error;
    }
  }

  async buildOrgTree(): Promise<Organization[]> {
    const organizations = await this.organizationRepository.find();

    // Build tree structure
    const orgMap = new Map<string, Organization & { children: Organization[] }>();
    const rootOrgs: (Organization & { children: Organization[] })[] = [];

    // Create map for quick lookup
    organizations.forEach(org => {
      orgMap.set(org.id, { ...org, children: [] });
    });

    // Build tree structure
    organizations.forEach(org => {
      const orgNode = orgMap.get(org.id)!;
      
      if (org.parentOrgId) {
        const parent = orgMap.get(org.parentOrgId);
        if (parent) {
          parent.children.push(orgNode);
        }
      } else {
        rootOrgs.push(orgNode);
      }
    });

    return rootOrgs;
  }

  getAccessibleOrgIds(user: User, orgTree: (Organization & { children: Organization[] })[]): string[] {
    const accessibleIds = [user.orgId];

    // Find user's organization in tree
    const userOrg = this.findOrgInTree(user.orgId, orgTree);
    if (userOrg && userOrg.children) {
      // Add direct children
      userOrg.children.forEach(child => {
        accessibleIds.push(child.id);
      });
    }

    return accessibleIds;
  }

  private findOrgInTree(orgId: string, orgTree: (Organization & { children: Organization[] })[]): (Organization & { children: Organization[] }) | null {
    for (const org of orgTree) {
      if (org.id === orgId) {
        return org;
      }
      if (org.children) {
        const found = this.findOrgInTree(orgId, org.children);
        if (found) return found;
      }
    }
    return null;
  }

  mapToTaskResponse(task: Task): TaskResponseDto {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      category: task.category as TaskCategory,
      orgId: task.orgId,
      createdByUserId: task.createdByUserId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
