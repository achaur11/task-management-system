import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction, Role } from 'data';

describe('AuditController', () => {
  let controller: AuditController;
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

  const mockAuditLog: AuditLog = {
    id: 'audit-1',
    userId: 'user-1',
    action: AuditAction.CREATE,
    resourceType: 'Task',
    resourceId: 'task-1',
    metadata: { title: 'Test Task' },
    timestamp: new Date('2024-01-01'),
    user: {
      ...mockUser,
      id: 'user-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAuditLogs: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockResult = {
        data: [mockAuditLog],
        page: 1,
        pageSize: 20,
        total: 1,
      };

      auditService.findAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(result).toMatchObject({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'audit-1',
            action: AuditAction.CREATE,
            resourceType: 'Task',
            resourceId: 'task-1',
            user: expect.objectContaining({
              id: 'user-1',
              email: 'test@example.com',
            }),
          }),
        ]),
        page: 1,
        pageSize: 20,
        total: 1,
      });
      expect(auditService.findAuditLogs).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const mockResult = {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
      };

      auditService.findAuditLogs.mockResolvedValue(mockResult);

      const from = '2024-01-01T00:00:00.000Z';
      const to = '2024-12-31T23:59:59.999Z';

      await controller.getAuditLogs(
        mockUser,
        AuditAction.CREATE,
        'user-1',
        'Task',
        'task-1',
        from,
        to,
        1,
        20,
      );

      expect(auditService.findAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          userId: 'user-1',
          resourceType: 'Task',
          resourceId: 'task-1',
          from: new Date(from),
          to: new Date(to),
          page: 1,
          pageSize: 20,
        }),
        mockUser,
      );
    });

    it('should handle missing optional filters', async () => {
      const mockResult = {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
      };

      auditService.findAuditLogs.mockResolvedValue(mockResult);

      await controller.getAuditLogs(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(auditService.findAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: undefined,
          userId: undefined,
          resourceType: undefined,
          resourceId: undefined,
          from: undefined,
          to: undefined,
        }),
        mockUser,
      );
    });

    it('should format audit log response correctly', async () => {
      const mockResult = {
        data: [mockAuditLog],
        page: 1,
        pageSize: 20,
        total: 1,
      };

      auditService.findAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(result.data[0]).toMatchObject({
        id: 'audit-1',
        userId: 'user-1',
        action: AuditAction.CREATE,
        resourceType: 'Task',
        resourceId: 'task-1',
        metadata: { title: 'Test Task' },
        timestamp: expect.any(String), // ISO string
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
        },
      });
    });

    it('should handle audit log without user', async () => {
      const auditLogWithoutUser = {
        ...mockAuditLog,
        user: null,
      };

      const mockResult = {
        data: [auditLogWithoutUser],
        page: 1,
        pageSize: 20,
        total: 1,
      };

      auditService.findAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(
        mockUser,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(result.data[0].user).toBeNull();
    });
  });
});

