import { Role } from 'data';
import { User, Task, Organization } from './auth.types';
import { isAtLeast, getUserPermissions } from './rbac.util';
import { orgContains } from './org.util';

export interface TaskPermissionContext {
  user: User;
  task?: Task;
  targetOrgId?: string;
  orgTree?: Organization[];
}

/**
 * Check if user can read tasks in the specified organization
 */
export function canReadTask(context: TaskPermissionContext): boolean {
  const { user, targetOrgId, orgTree } = context;
  
  if (!targetOrgId) {
    return false;
  }

  // Check if user has read permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canRead) {
    return false;
  }

  // Check organization access
  return orgContains(user.orgId, targetOrgId, orgTree);
}

/**
 * Check if user can create tasks in the specified organization
 */
export function canCreateTask(context: TaskPermissionContext): boolean {
  const { user, targetOrgId, orgTree } = context;
  
  if (!targetOrgId) {
    return false;
  }

  // Check if user has create permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canCreate) {
    return false;
  }

  // Check organization access
  return orgContains(user.orgId, targetOrgId, orgTree);
}

/**
 * Check if user can update a specific task
 */
export function canUpdateTask(context: TaskPermissionContext): boolean {
  const { user, task } = context;
  
  if (!task) {
    return false;
  }

  // Check if user has update permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canUpdate) {
    return false;
  }

  // Check organization access
  return orgContains(user.orgId, task.orgId, context.orgTree);
}

/**
 * Check if user can delete a specific task
 */
export function canDeleteTask(context: TaskPermissionContext): boolean {
  const { user, task } = context;
  
  if (!task) {
    return false;
  }

  // Check if user has delete permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canDelete) {
    return false;
  }

  // Check organization access
  return orgContains(user.orgId, task.orgId, context.orgTree);
}

/**
 * Check if user can manage users in the specified organization
 */
export function canManageUsers(context: TaskPermissionContext): boolean {
  const { user, targetOrgId, orgTree } = context;
  
  if (!targetOrgId) {
    return false;
  }

  // Check if user has user management permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canManageUsers) {
    return false;
  }

  // Check organization access
  return orgContains(user.orgId, targetOrgId, orgTree);
}

/**
 * Check if user can manage organization settings
 */
export function canManageOrg(context: TaskPermissionContext): boolean {
  const { user, targetOrgId, orgTree } = context;
  
  if (!targetOrgId) {
    return false;
  }

  // Check if user has org management permission
  const permissions = getUserPermissions(user.role);
  if (!permissions.canManageOrg) {
    return false;
  }

  // Check organization access (only owners can manage org)
  return orgContains(user.orgId, targetOrgId, orgTree);
}

/**
 * Get all organization IDs where user can perform the specified action
 */
export function getAccessibleOrgIdsForAction(
  user: User,
  action: 'read' | 'create' | 'update' | 'delete' | 'manageUsers' | 'manageOrg',
  orgTree?: Organization[]
): string[] {
  const permissions = getUserPermissions(user.role);
  
  // Check if user has permission for the action
  const hasPermission = (() => {
    switch (action) {
      case 'read': return permissions.canRead;
      case 'create': return permissions.canCreate;
      case 'update': return permissions.canUpdate;
      case 'delete': return permissions.canDelete;
      case 'manageUsers': return permissions.canManageUsers;
      case 'manageOrg': return permissions.canManageOrg;
      default: return false;
    }
  })();

  if (!hasPermission) {
    return [];
  }

  // Return accessible org IDs (own org + direct children)
  const accessibleIds = [user.orgId];
  
  if (orgTree) {
    const userOrg = orgTree.find(org => org.id === user.orgId);
    if (userOrg && userOrg.children) {
      userOrg.children.forEach(child => {
        accessibleIds.push(child.id);
      });
    }
  }

  return accessibleIds;
}
