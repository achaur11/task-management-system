import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { Roles, JwtUser } from 'auth';
import { Role, AuditAction } from 'data';

import { AuditService } from './audit.service';
import { User } from '../entities/user.entity';

@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.Admin, Role.Owner)
  async getAuditLogs(
    @JwtUser() user: User,
    @Query('action', new ParseEnumPipe(AuditAction, { optional: true })) action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize?: number,
  ) {
    const filters = {
      action,
      userId,
      resourceType,
      resourceId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page,
      pageSize,
    };

    const result = await this.auditService.findAuditLogs(filters);
    
    return {
      data: result.data.map(auditLog => ({
        id: auditLog.id,
        userId: auditLog.userId,
        action: auditLog.action,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        metadata: auditLog.metadata,
        timestamp: auditLog.timestamp.toISOString(),
        user: auditLog.user ? {
          id: auditLog.user.id,
          email: auditLog.user.email,
          displayName: auditLog.user.displayName,
        } : null,
      })),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
    };
  }
}
