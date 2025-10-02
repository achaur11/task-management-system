import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from '../entities/audit-log.entity';
import { AuditAction } from 'data';

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
  }) {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.timestamp', 'DESC');

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
}
