import { Organization } from './auth.types';

/**
 * Check if candidate organization is the same as parent or a direct child
 * Supports 2-level hierarchy: parent -> child
 */
export function orgContains(
  parentOrgId: string,
  candidateOrgId: string,
  orgTree?: Organization[]
): boolean {
  if (parentOrgId === candidateOrgId) {
    return true;
  }

  if (!orgTree) {
    return false;
  }

  // Find parent organization
  const parentOrg = orgTree.find(org => org.id === parentOrgId);
  if (!parentOrg) {
    return false;
  }

  // Check if candidate is a direct child
  const isDirectChild = parentOrg.children?.some(
    child => child.id === candidateOrgId
  );

  return isDirectChild || false;
}

/**
 * Get all organization IDs that user has access to (own org + direct children)
 */
export function getUserAccessibleOrgIds(
  userOrgId: string,
  orgTree?: Organization[]
): string[] {
  const accessibleIds = [userOrgId];

  if (!orgTree) {
    return accessibleIds;
  }

  // Find user's organization
  const userOrg = orgTree.find(org => org.id === userOrgId);
  if (userOrg && userOrg.children) {
    // Add direct children
    userOrg.children.forEach(child => {
      accessibleIds.push(child.id);
    });
  }

  return accessibleIds;
}

/**
 * Check if user can access organization based on hierarchy
 */
export function canAccessOrg(
  userOrgId: string,
  targetOrgId: string,
  orgTree?: Organization[]
): boolean {
  return orgContains(userOrgId, targetOrgId, orgTree);
}

/**
 * Build organization tree structure from flat list
 */
export function buildOrgTree(organizations: Organization[]): Organization[] {
  const orgMap = new Map<string, Organization>();
  const rootOrgs: Organization[] = [];

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
        parent.children!.push(orgNode);
      }
    } else {
      rootOrgs.push(orgNode);
    }
  });

  return rootOrgs;
}
