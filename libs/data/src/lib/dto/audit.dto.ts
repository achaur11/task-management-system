import { AuditAction } from '../enums';

export class AuditLogResponseDto {
  id!: string;
  userId!: string;
  action!: AuditAction;
  resourceType!: string;
  resourceId!: string;
  timestamp!: string;
  metadata?: Record<string, unknown>;
}
