import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskStatus, TaskCategory } from 'data';
import { User } from '../entities/user.entity';
import { Role } from 'data';
import { ForbiddenException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: jest.Mocked<TasksService>;

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

  const mockTaskResponse = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.Backlog,
    category: TaskCategory.Work,
    orgId: 'org-1',
    createdByUserId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            buildOrgTree: jest.fn(),
            getAccessibleOrgIds: jest.fn(),
            mapToTaskResponse: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.Backlog,
        category: TaskCategory.Work,
      };

      tasksService.create.mockResolvedValue(mockTaskResponse);

      const result = await controller.create(mockUser, createTaskDto);

      expect(result).toEqual({ data: mockTaskResponse });
      expect(tasksService.create).toHaveBeenCalledWith(createTaskDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks', async () => {
      const mockResult = {
        data: [mockTaskResponse],
        page: 1,
        pageSize: 20,
        total: 1,
      };

      tasksService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        mockUser,
        {},
        undefined,
        undefined,
        undefined,
        1,
        20,
        'updatedAt',
        'desc',
      );

      expect(result).toEqual(mockResult);
      expect(tasksService.findAll).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          sortBy: 'updatedAt',
          sortDir: 'desc',
        }),
      );
    });

    it('should apply filters correctly', async () => {
      const mockResult = {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
      };

      tasksService.findAll.mockResolvedValue(mockResult);

      await controller.findAll(
        mockUser,
        {},
        TaskStatus.InProgress,
        TaskCategory.Work,
        'search query',
        1,
        20,
        'title',
        'asc',
      );

      expect(tasksService.findAll).toHaveBeenCalledWith(
        mockUser,
        expect.objectContaining({
          status: TaskStatus.InProgress,
          category: TaskCategory.Work,
          q: 'search query',
          sortBy: 'title',
          sortDir: 'asc',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const mockTask = {
        id: 'task-1',
        orgId: 'org-1',
        title: 'Test Task',
      } as any;

      tasksService.findOne.mockResolvedValue(mockTask);
      tasksService.buildOrgTree.mockResolvedValue([]);
      tasksService.getAccessibleOrgIds.mockReturnValue(['org-1']);
      tasksService.mapToTaskResponse.mockReturnValue(mockTaskResponse);

      const result = await controller.findOne(mockUser, 'task-1');

      expect(result).toEqual({ data: mockTaskResponse });
      expect(tasksService.findOne).toHaveBeenCalledWith('task-1');
    });

    it('should throw ForbiddenException when user cannot access task', async () => {
      const mockTask = {
        id: 'task-1',
        orgId: 'org-2', // Different org
      } as any;

      tasksService.findOne.mockResolvedValue(mockTask);
      tasksService.buildOrgTree.mockResolvedValue([]);
      tasksService.getAccessibleOrgIds.mockReturnValue(['org-1']); // User can only access org-1

      await expect(controller.findOne(mockUser, 'task-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.InProgress,
      };

      tasksService.update.mockResolvedValue(mockTaskResponse);

      const result = await controller.update(mockUser, 'task-1', updateTaskDto);

      expect(result).toEqual({ data: mockTaskResponse });
      expect(tasksService.update).toHaveBeenCalledWith(mockUser, 'task-1', updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should delete a task', async () => {
      tasksService.remove.mockResolvedValue({ success: true });

      const result = await controller.remove(mockUser, 'task-1');

      expect(result).toEqual({ success: true });
      expect(tasksService.remove).toHaveBeenCalledWith(mockUser, 'task-1');
    });
  });
});

