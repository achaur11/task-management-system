import { Role } from 'data';
import { roleRank, isAtLeast, hasRole, getUserPermissions } from './rbac.util';

describe('RBAC Utils', () => {
  describe('roleRank', () => {
    it('should return correct ranking for each role', () => {
      expect(roleRank(Role.Owner)).toBe(3);
      expect(roleRank(Role.Admin)).toBe(2);
      expect(roleRank(Role.Viewer)).toBe(1);
    });
  });

  describe('isAtLeast', () => {
    it('should return true when user role meets minimum requirement', () => {
      expect(isAtLeast(Role.Owner, Role.Viewer)).toBe(true);
      expect(isAtLeast(Role.Owner, Role.Admin)).toBe(true);
      expect(isAtLeast(Role.Owner, Role.Owner)).toBe(true);
      expect(isAtLeast(Role.Admin, Role.Viewer)).toBe(true);
      expect(isAtLeast(Role.Admin, Role.Admin)).toBe(true);
      expect(isAtLeast(Role.Viewer, Role.Viewer)).toBe(true);
    });

    it('should return false when user role is below requirement', () => {
      expect(isAtLeast(Role.Viewer, Role.Admin)).toBe(false);
      expect(isAtLeast(Role.Viewer, Role.Owner)).toBe(false);
      expect(isAtLeast(Role.Admin, Role.Owner)).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has one of the allowed roles', () => {
      expect(hasRole(Role.Owner, [Role.Owner, Role.Admin])).toBe(true);
      expect(hasRole(Role.Admin, [Role.Owner, Role.Admin])).toBe(true);
      expect(hasRole(Role.Viewer, [Role.Viewer])).toBe(true);
    });

    it('should return false when user does not have any allowed role', () => {
      expect(hasRole(Role.Viewer, [Role.Owner, Role.Admin])).toBe(false);
      expect(hasRole(Role.Admin, [Role.Owner])).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return full permissions for Owner', () => {
      const permissions = getUserPermissions(Role.Owner);
      expect(permissions.canRead).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canUpdate).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManageOrg).toBe(true);
    });

    it('should return limited permissions for Admin', () => {
      const permissions = getUserPermissions(Role.Admin);
      expect(permissions.canRead).toBe(true);
      expect(permissions.canCreate).toBe(true);
      expect(permissions.canUpdate).toBe(true);
      expect(permissions.canDelete).toBe(true);
      expect(permissions.canManageUsers).toBe(true);
      expect(permissions.canManageOrg).toBe(false);
    });

    it('should return read-only permissions for Viewer', () => {
      const permissions = getUserPermissions(Role.Viewer);
      expect(permissions.canRead).toBe(true);
      expect(permissions.canCreate).toBe(false);
      expect(permissions.canUpdate).toBe(false);
      expect(permissions.canDelete).toBe(false);
      expect(permissions.canManageUsers).toBe(false);
      expect(permissions.canManageOrg).toBe(false);
    });
  });
});
