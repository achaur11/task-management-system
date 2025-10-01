import { Role } from 'data';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  orgId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  org?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  parentOrgId?: string;
  createdAt: Date;
  updatedAt: Date;
  children?: Organization[];
  users?: User[];
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  category: string;
  createdByUserId?: string;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  creator?: User;
}

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  role: string;
}

export interface OrgScopeData {
  userOrgId: string;
  accessibleOrgIds: string[];
  user: User;
}
