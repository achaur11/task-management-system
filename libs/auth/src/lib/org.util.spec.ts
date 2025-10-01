import { Organization } from './auth.types';
import { orgContains, getUserAccessibleOrgIds, canAccessOrg, buildOrgTree } from './org.util';

describe('Org Utils', () => {
  const mockOrgTree: Organization[] = [
    {
      id: 'parent-1',
      name: 'Parent Org 1',
      parentOrgId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [
        {
          id: 'child-1-1',
          name: 'Child Org 1-1',
          parentOrgId: 'parent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
        },
        {
          id: 'child-1-2',
          name: 'Child Org 1-2',
          parentOrgId: 'parent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
        },
      ],
    },
    {
      id: 'parent-2',
      name: 'Parent Org 2',
      parentOrgId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    },
  ];

  describe('orgContains', () => {
    it('should return true when candidate is the same as parent', () => {
      expect(orgContains('parent-1', 'parent-1', mockOrgTree)).toBe(true);
    });

    it('should return true when candidate is a direct child', () => {
      expect(orgContains('parent-1', 'child-1-1', mockOrgTree)).toBe(true);
      expect(orgContains('parent-1', 'child-1-2', mockOrgTree)).toBe(true);
    });

    it('should return false when candidate is unrelated', () => {
      expect(orgContains('parent-1', 'parent-2', mockOrgTree)).toBe(false);
      expect(orgContains('parent-2', 'child-1-1', mockOrgTree)).toBe(false);
    });

    it('should return false when orgTree is not provided', () => {
      expect(orgContains('parent-1', 'child-1-1')).toBe(false);
    });
  });

  describe('getUserAccessibleOrgIds', () => {
    it('should return user org ID when no children exist', () => {
      const result = getUserAccessibleOrgIds('parent-2', mockOrgTree);
      expect(result).toEqual(['parent-2']);
    });

    it('should return user org ID and children when children exist', () => {
      const result = getUserAccessibleOrgIds('parent-1', mockOrgTree);
      expect(result).toEqual(['parent-1', 'child-1-1', 'child-1-2']);
    });

    it('should return only user org ID when orgTree is not provided', () => {
      const result = getUserAccessibleOrgIds('parent-1');
      expect(result).toEqual(['parent-1']);
    });
  });

  describe('canAccessOrg', () => {
    it('should return true when user can access the organization', () => {
      expect(canAccessOrg('parent-1', 'child-1-1', mockOrgTree)).toBe(true);
      expect(canAccessOrg('parent-1', 'parent-1', mockOrgTree)).toBe(true);
    });

    it('should return false when user cannot access the organization', () => {
      expect(canAccessOrg('parent-1', 'parent-2', mockOrgTree)).toBe(false);
    });
  });

  describe('buildOrgTree', () => {
    it('should build correct tree structure from flat list', () => {
      const flatOrgs: Organization[] = [
        {
          id: 'root-1',
          name: 'Root 1',
          parentOrgId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'child-1',
          name: 'Child 1',
          parentOrgId: 'root-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'child-2',
          name: 'Child 2',
          parentOrgId: 'root-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'root-2',
          name: 'Root 2',
          parentOrgId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const tree = buildOrgTree(flatOrgs);
      
      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe('root-1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children![0].id).toBe('child-1');
      expect(tree[0].children![1].id).toBe('child-2');
      expect(tree[1].id).toBe('root-2');
      expect(tree[1].children).toHaveLength(0);
    });
  });
});
