import { Role } from 'data';

/**
 * Role hierarchy ranking (higher number = more permissions)
 */
export function roleRank(role: Role): number {
  switch (role) {
    case Role.Owner:
      return 3;
    case Role.Admin:
      return 2;
    case Role.Viewer:
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if user role meets minimum required role
 */
export function isAtLeast(userRole: Role, requiredRole: Role): boolean {
  return roleRank(userRole) >= roleRank(requiredRole);
}

/**
 * Check if user has any of the allowed roles
 */
export function hasRole(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get user's effective permissions based on role
 */
export interface UserPermissions {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canManageOrg: boolean;
}

export function getUserPermissions(role: Role): UserPermissions {
  switch (role) {
    case Role.Owner:
      return {
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canManageUsers: true,
        canManageOrg: true,
      };
    case Role.Admin:
      return {
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canManageUsers: true,
        canManageOrg: false,
      };
    case Role.Viewer:
      return {
        canRead: true,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canManageUsers: false,
        canManageOrg: false,
      };
    default:
      return {
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canManageUsers: false,
        canManageOrg: false,
      };
  }
}
