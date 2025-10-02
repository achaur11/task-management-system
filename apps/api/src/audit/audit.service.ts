import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditAction, Role } from 'data';

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async log(auditData: AuditLogData): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId: auditData.userId,
      action: auditData.action,
      resourceType: auditData.resourceType,
      resourceId: auditData.resourceId,
      metadata: auditData.metadata,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async logTaskAction(
    userId: string,
    action: AuditAction,
    taskId: string,
    metadata?: Record<string, any>,
  ): Promise<AuditLog> {
    return this.log({
      userId,
      action,
      resourceType: 'Task',
      resourceId: taskId,
      metadata,
    });
  }

  async findAuditLogs(filters: {
    action?: AuditAction;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }, user: User) {
    // Get accessible organization IDs based on user role and org hierarchy
    const accessibleOrgIds = await this.getAccessibleOrgIds(user);

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .leftJoin('user.org', 'userOrg')
      .orderBy('auditLog.timestamp', 'DESC');

    // Organization scoping - only show audit logs from accessible organizations
    queryBuilder.andWhere('userOrg.id IN (:...accessibleOrgIds)', { 
      accessibleOrgIds 
    });

    if (filters.action) {
      queryBuilder.andWhere('auditLog.action = :action', { action: filters.action });
    }

    if (filters.userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId: filters.userId });
    }

    if (filters.resourceType) {
      queryBuilder.andWhere('auditLog.resourceType = :resourceType', { resourceType: filters.resourceType });
    }

    if (filters.resourceId) {
      queryBuilder.andWhere('auditLog.resourceId = :resourceId', { resourceId: filters.resourceId });
    }

    if (filters.from) {
      queryBuilder.andWhere('auditLog.timestamp >= :from', { from: filters.from });
    }

    if (filters.to) {
      queryBuilder.andWhere('auditLog.timestamp <= :to', { to: filters.to });
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [auditLogs, total] = await queryBuilder
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      data: auditLogs,
      page,
      pageSize,
      total,
    };
  }

  /**
   * Get accessible organization IDs based on user role and organization hierarchy
   * - Admin: Can see audit logs from their own organization only
   * - Owner: Can see audit logs from their organization and all child organizations
   */
  private async getAccessibleOrgIds(user: User): Promise<string[]> {
    const accessibleOrgIds = [user.orgId];

    // If user is Owner, include all child organizations
    if (user.role === Role.Owner) {
      const childOrgIds = await this.getChildOrganizationIds(user.orgId);
      accessibleOrgIds.push(...childOrgIds);
    }

    return accessibleOrgIds;
  }

  /**
   * Get all child organization IDs recursively
   */
  private async getChildOrganizationIds(parentOrgId: string): Promise<string[]> {
    const childOrgs = await this.organizationRepository.find({
      where: { parentOrgId },
      select: ['id'],
    });

    let allChildIds: string[] = [];
    
    for (const childOrg of childOrgs) {
      allChildIds.push(childOrg.id);
      // Recursively get children of children
      const grandChildIds = await this.getChildOrganizationIds(childOrg.id);
      allChildIds.push(...grandChildIds);
    }

    return allChildIds;
  }
}
