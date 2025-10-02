export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface AuditFilters {
  action?: AuditAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  page: number;
  pageSize: number;
  total: number;
}
