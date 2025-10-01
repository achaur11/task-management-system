import { Role } from 'data';
import { User, Task, Organization } from './auth.types';
import {
  canReadTask,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  canManageUsers,
  canManageOrg,
  getAccessibleOrgIdsForAction,
  TaskPermissionContext,
} from './task-permissions.util';

describe('Task Permissions Utils', () => {
  const mockOrgTree: Organization[] = [
    {
      id: 'parent-1',
      name: 'Parent Org 1',
      parentOrgId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [
        {
          id: 'child-1',
          name: 'Child Org 1',
          parentOrgId: 'parent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
        },
      ],
    },
  ];

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'Backlog' as any,
    category: 'Work' as any,
    orgId: 'child-1',
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    displayName: 'Test User',
    orgId: 'parent-1',
    role: Role.Owner,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('canReadTask', () => {
    it('should allow Owner to read tasks in accessible orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canReadTask(context)).toBe(true);
    });

    it('should deny access to unrelated orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        targetOrgId: 'unrelated-org',
        orgTree: mockOrgTree,
      };
      expect(canReadTask(context)).toBe(false);
    });

    it('should deny Viewer access when no org specified', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const context: TaskPermissionContext = {
        user: viewerUser,
        targetOrgId: undefined,
        orgTree: mockOrgTree,
      };
      expect(canReadTask(context)).toBe(false);
    });
  });

  describe('canCreateTask', () => {
    it('should allow Owner to create tasks in accessible orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canCreateTask(context)).toBe(true);
    });

    it('should deny Viewer from creating tasks', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const context: TaskPermissionContext = {
        user: viewerUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canCreateTask(context)).toBe(false);
    });
  });

  describe('canUpdateTask', () => {
    it('should allow Owner to update tasks in accessible orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        task: mockTask,
        orgTree: mockOrgTree,
      };
      expect(canUpdateTask(context)).toBe(true);
    });

    it('should deny Viewer from updating tasks', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const context: TaskPermissionContext = {
        user: viewerUser,
        task: mockTask,
        orgTree: mockOrgTree,
      };
      expect(canUpdateTask(context)).toBe(false);
    });

    it('should deny access when no task provided', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        task: undefined,
        orgTree: mockOrgTree,
      };
      expect(canUpdateTask(context)).toBe(false);
    });
  });

  describe('canDeleteTask', () => {
    it('should allow Owner to delete tasks in accessible orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        task: mockTask,
        orgTree: mockOrgTree,
      };
      expect(canDeleteTask(context)).toBe(true);
    });

    it('should deny Viewer from deleting tasks', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const context: TaskPermissionContext = {
        user: viewerUser,
        task: mockTask,
        orgTree: mockOrgTree,
      };
      expect(canDeleteTask(context)).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('should allow Owner to manage users in accessible orgs', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canManageUsers(context)).toBe(true);
    });

    it('should allow Admin to manage users', () => {
      const adminUser = { ...mockUser, role: Role.Admin };
      const context: TaskPermissionContext = {
        user: adminUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canManageUsers(context)).toBe(true);
    });

    it('should deny Viewer from managing users', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const context: TaskPermissionContext = {
        user: viewerUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canManageUsers(context)).toBe(false);
    });
  });

  describe('canManageOrg', () => {
    it('should allow Owner to manage org settings', () => {
      const context: TaskPermissionContext = {
        user: mockUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canManageOrg(context)).toBe(true);
    });

    it('should deny Admin from managing org settings', () => {
      const adminUser = { ...mockUser, role: Role.Admin };
      const context: TaskPermissionContext = {
        user: adminUser,
        targetOrgId: 'child-1',
        orgTree: mockOrgTree,
      };
      expect(canManageOrg(context)).toBe(false);
    });
  });

  describe('getAccessibleOrgIdsForAction', () => {
    it('should return accessible org IDs for Owner', () => {
      const result = getAccessibleOrgIdsForAction(mockUser, 'read', mockOrgTree);
      expect(result).toEqual(['parent-1', 'child-1']);
    });

    it('should return empty array for Viewer when action is create', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const result = getAccessibleOrgIdsForAction(viewerUser, 'create', mockOrgTree);
      expect(result).toEqual([]);
    });

    it('should return accessible org IDs for Viewer when action is read', () => {
      const viewerUser = { ...mockUser, role: Role.Viewer };
      const result = getAccessibleOrgIdsForAction(viewerUser, 'read', mockOrgTree);
      expect(result).toEqual(['parent-1', 'child-1']);
    });
  });
});
