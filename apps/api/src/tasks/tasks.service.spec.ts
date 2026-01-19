import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditService } from '../audit/audit.service';
import { CreateTaskDto, UpdateTaskDto, TaskStatus, TaskCategory } from 'data';
import { Role } from 'data';
import * as authUtils from 'auth';

// Mock the auth module
jest.mock('auth', () => ({
  canCreateTask: jest.fn(),
  canUpdateTask: jest.fn(),
  canDeleteTask: jest.fn(),
}));

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let auditService: jest.Mocked<AuditService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    displayName: 'Test User',
    orgId: 'org-1',
    role: Role.Admin,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: null,
    createdTasks: [],
    auditLogs: [],
  };

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.Backlog,
    category: TaskCategory.Work,
    orgId: 'org-1',
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    org: null,
    creator: null,
  };

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Org',
    parentOrgId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [],
    users: [],
    tasks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logTaskAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    auditService = module.get(AuditService) as jest.Mocked<AuditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    (authUtils.canCreateTask as jest.Mock).mockReset();
    (authUtils.canCreateTask as jest.Mock).mockReturnValue(true);
  });

  describe('create', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task Description',
        status: TaskStatus.Backlog,
        category: TaskCategory.Work,
      };

      const savedTask = { ...mockTask, ...createTaskDto };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (authUtils.canCreateTask as jest.Mock).mockReturnValue(true);
      organizationRepository.find.mockResolvedValue([mockOrganization]);
      taskRepository.create.mockReturnValue(savedTask as any);
      taskRepository.save.mockResolvedValue(savedTask);
      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      auditService.logTaskAction.mockResolvedValue({} as any);

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toMatchObject({
        id: savedTask.id,
        title: 'New Task',
        status: TaskStatus.Backlog,
        category: TaskCategory.Work,
        orgId: 'org-1',
      });
      expect(taskRepository.create).toHaveBeenCalled();
      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditService.logTaskAction).toHaveBeenCalledWith(
        'user-1',
        expect.any(String),
        savedTask.id,
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when user cannot create tasks', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Task Description',
      };

      (authUtils.canCreateTask as jest.Mock).mockReturnValueOnce(false);
      organizationRepository.find.mockResolvedValue([mockOrganization]);

      await expect(service.create(createTaskDto, mockUser)).rejects.toThrow(ForbiddenException);
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('should use default status and category when not provided', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
      };

      const savedTask = { ...mockTask, title: 'New Task', status: TaskStatus.Backlog, category: TaskCategory.Work };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      (authUtils.canCreateTask as jest.Mock).mockReturnValueOnce(true);
      organizationRepository.find.mockResolvedValue([mockOrganization]);
      taskRepository.create.mockReturnValue(savedTask as any);
      taskRepository.save.mockResolvedValue(savedTask);
      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      auditService.logTaskAction.mockResolvedValue({} as any);

      await service.create(createTaskDto, mockUser);

      expect(taskRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.Backlog,
          category: TaskCategory.Work,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks with filters', async () => {
      const filters = {
        status: TaskStatus.InProgress,
        page: 1,
        pageSize: 10,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTask], 1]),
      };

      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockUser, filters);

      expect(result).toMatchObject({
        data: expect.any(Array),
        page: 1,
        pageSize: 10,
        total: 1,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply search query filter', async () => {
      const filters = {
        q: 'test',
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(mockUser, filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Object),
      );
    });

    it('should use default pagination values', async () => {
      const filters = {};

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      taskRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(mockUser, filters);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1');

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.InProgress,
      };

      const updatedTask = { ...mockTask, ...updateTaskDto };

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(updatedTask);
      auditService.logTaskAction.mockResolvedValue({} as any);

      const result = await service.update(mockUser, 'task-1', updateTaskDto);

      expect(result).toMatchObject({
        id: 'task-1',
        title: 'Updated Task',
        status: TaskStatus.InProgress,
      });
      expect(taskRepository.save).toHaveBeenCalled();
      expect(auditService.logTaskAction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updating task from different org', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };
      const taskFromDifferentOrg = { ...mockTask, orgId: 'org-2' };

      taskRepository.findOne.mockResolvedValue(taskFromDifferentOrg);

      await expect(service.update(mockUser, 'task-1', updateTaskDto)).rejects.toThrow(ForbiddenException);
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const updateTaskDto: UpdateTaskDto = { title: 'Updated Task' };

      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser, 'non-existent', updateTaskDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.remove.mockResolvedValue(mockTask);
      auditService.logTaskAction.mockResolvedValue({} as any);

      const result = await service.remove(mockUser, 'task-1');

      expect(result).toEqual({ success: true });
      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditService.logTaskAction).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when deleting task from different org', async () => {
      const taskFromDifferentOrg = { ...mockTask, orgId: 'org-2' };

      taskRepository.findOne.mockResolvedValue(taskFromDifferentOrg);

      await expect(service.remove(mockUser, 'task-1')).rejects.toThrow(ForbiddenException);
      expect(taskRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when task does not exist', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser, 'non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('buildOrgTree', () => {
    it('should build organization tree structure', async () => {
      const parentOrg = { ...mockOrganization, id: 'org-1' };
      const childOrg = { ...mockOrganization, id: 'org-2', parentOrgId: 'org-1' };

      organizationRepository.find.mockResolvedValue([parentOrg, childOrg]);

      const result = await service.buildOrgTree();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('org-1');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('org-2');
    });

    it('should return empty array when no organizations exist', async () => {
      organizationRepository.find.mockResolvedValue([]);

      const result = await service.buildOrgTree();

      expect(result).toEqual([]);
    });
  });

  describe('getAccessibleOrgIds', () => {
    it('should return user org and children orgs', () => {
      const orgTree = [
        {
          ...mockOrganization,
          id: 'org-1',
          children: [
            { ...mockOrganization, id: 'org-2', parentOrgId: 'org-1', children: [] },
          ],
        },
      ];

      const result = service.getAccessibleOrgIds(mockUser, orgTree as any);

      expect(result).toContain('org-1');
      expect(result).toContain('org-2');
    });

    it('should return only user org when no children exist', () => {
      const orgTree = [{ ...mockOrganization, id: 'org-1', children: [] }];

      const result = service.getAccessibleOrgIds(mockUser, orgTree as any);

      expect(result).toEqual(['org-1']);
    });
  });

  describe('mapToTaskResponse', () => {
    it('should map task entity to response DTO', () => {
      const result = service.mapToTaskResponse(mockTask);

      expect(result).toMatchObject({
        id: 'task-1',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.Backlog,
        category: TaskCategory.Work,
        orgId: 'org-1',
        createdByUserId: 'user-1',
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });
});

