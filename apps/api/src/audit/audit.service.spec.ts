/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditService } from './audit.service';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditAction, Role } from 'data';

describe('AuditService', () => {
  let service: AuditService;
  let auditLogRepository: jest.Mocked<Repository<AuditLog>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;

  // Shared mock objects - created once, reused across all tests
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed',
    displayName: 'Test User',
    orgId: 'org-1',
    role: Role.Owner,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: null,
    createdTasks: [],
    auditLogs: [],
  };

  const mockAuditLog: AuditLog = {
    id: 'audit-1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    resourceType: 'Task',
    resourceId: 'task-1',
    metadata: { title: 'Test Task' },
    timestamp: new Date(),
    user: mockUser,
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

  // Reusable mockQueryBuilder factory - creates fresh mocks when needed
  // but reuses the same structure instead of creating new objects each time
  let sharedMockQueryBuilder: any;

  // Factory function to create/reset mockQueryBuilder
  const createMockQueryBuilder = (overrides?: { getManyAndCount?: jest.Mock }) => {
    if (!sharedMockQueryBuilder) {
      sharedMockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
    } else {
      // Reset all mocks but reuse the object
      Object.values(sharedMockQueryBuilder).forEach((fn: any) => {
        if (jest.isMockFunction(fn)) {
          fn.mockClear();
          if (fn !== sharedMockQueryBuilder.getManyAndCount) {
            fn.mockReturnThis();
          }
        }
      });
    }
    
    // Apply any overrides
    if (overrides?.getManyAndCount) {
      sharedMockQueryBuilder.getManyAndCount = overrides.getManyAndCount;
    }
    
    return sharedMockQueryBuilder;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    auditLogRepository = module.get(getRepositoryToken(AuditLog));
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
  });

  afterEach(() => {
    // Clear all mocks and reset implementations to prevent memory leaks
    jest.clearAllMocks();
    organizationRepository.find.mockReset();
    auditLogRepository.createQueryBuilder.mockReset();
    // Reset shared mockQueryBuilder if it exists
    if (sharedMockQueryBuilder) {
      Object.values(sharedMockQueryBuilder).forEach((fn: any) => {
        if (jest.isMockFunction(fn)) {
          fn.mockClear();
        }
      });
    }
  });

  // Clean up after all tests in this file
  afterAll(() => {
    // Release references to help garbage collection
    sharedMockQueryBuilder = null;
    // Force garbage collection after all tests in this file complete
    if (global.gc) {
      global.gc();
    }
  });

  describe('log', () => {
    it('should create and save an audit log', async () => {
      const auditData = {
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'Task',
        resourceId: 'task-1',
        metadata: { title: 'Test Task' },
      };

      auditLogRepository.create.mockReturnValue(mockAuditLog as any);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(auditData);

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith(auditData);
      expect(auditLogRepository.save).toHaveBeenCalledWith(mockAuditLog);
    });
  });

  describe('logTaskAction', () => {
    it('should log a task action', async () => {
      const metadata = { title: 'Test Task', status: 'Backlog' };

      auditLogRepository.create.mockReturnValue(mockAuditLog as any);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.logTaskAction('user-1', AuditAction.CREATE, 'task-1', metadata);

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'Task',
        resourceId: 'task-1',
        metadata,
      });
    });

    it('should log task action without metadata', async () => {
      auditLogRepository.create.mockReturnValue(mockAuditLog as any);
      auditLogRepository.save.mockResolvedValue(mockAuditLog);

      await service.logTaskAction('user-1', AuditAction.DELETE, 'task-1');

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        action: AuditAction.DELETE,
        resourceType: 'Task',
        resourceId: 'task-1',
        metadata: undefined,
      });
    });
  });

  describe('findAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const filters = {
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = createMockQueryBuilder({
        getManyAndCount: jest.fn().mockResolvedValue([[mockAuditLog], 1]),
      });

      organizationRepository.find.mockResolvedValue([mockOrganization]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAuditLogs(filters, mockUser);

      expect(result).toMatchObject({
        data: [mockAuditLog],
        page: 1,
        pageSize: 20,
        total: 1,
      });
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should apply action filter', async () => {
      const filters = {
        action: AuditAction.CREATE,
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = createMockQueryBuilder();
      organizationRepository.find.mockResolvedValue([mockOrganization]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAuditLogs(filters, mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.action = :action',
        { action: AuditAction.CREATE },
      );
    });

    it('should apply userId filter', async () => {
      const filters = {
        userId: 'user-1',
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = createMockQueryBuilder();
      organizationRepository.find.mockResolvedValue([mockOrganization]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAuditLogs(filters, mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.userId = :userId',
        { userId: 'user-1' },
      );
    });

    it('should apply date range filters', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-12-31');
      const filters = {
        from,
        to,
        page: 1,
        pageSize: 20,
      };

      const mockQueryBuilder = createMockQueryBuilder();
      organizationRepository.find.mockResolvedValue([mockOrganization]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAuditLogs(filters, mockUser);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.timestamp >= :from',
        { from },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'auditLog.timestamp <= :to',
        { to },
      );
    });

    it('should include child organizations for Owner role', async () => {
      const filters = {
        page: 1,
        pageSize: 20,
      };

      const childOrgId = 'org-2';
      const mockQueryBuilder = createMockQueryBuilder();

      // Simple mock: return child org when queried for org-1's children, empty otherwise
      // The recursion will naturally stop when no more children are found
      organizationRepository.find.mockImplementation((options: any) => {
        if (options?.where?.parentOrgId === 'org-1') {
          return Promise.resolve([{ id: childOrgId }]);
        }
        return Promise.resolve([]);
      });

      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAuditLogs(filters, mockUser);

      // Verify that both org-1 and org-2 are included in accessible orgs
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'userOrg.id IN (:...accessibleOrgIds)',
        expect.objectContaining({
          accessibleOrgIds: expect.arrayContaining(['org-1', childOrgId]),
        }),
      );
    });

    it('should use default pagination values', async () => {
      const filters = {};
      const mockQueryBuilder = createMockQueryBuilder();

      organizationRepository.find.mockResolvedValue([mockOrganization]);
      auditLogRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAuditLogs(filters, mockUser);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });
});

