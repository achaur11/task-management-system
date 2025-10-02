import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles, JwtUser } from 'auth';
import { Role, AuditAction } from 'data';
import { PaginatedResponseDto } from '../common/dto/api-response.dto';

import { AuditService } from './audit.service';
import { User } from '../entities/user.entity';

@ApiTags('Audit')
@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.Admin, Role.Owner)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get audit logs',
    description: 'Get a paginated list of audit logs with filtering options. Requires Admin or Owner role.'
  })
  @ApiQuery({ name: 'action', enum: AuditAction, required: false, description: 'Filter by audit action' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'resourceType', required: false, description: 'Filter by resource type' })
  @ApiQuery({ name: 'resourceId', required: false, description: 'Filter by resource ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of items per page (default: 20)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Audit logs retrieved successfully',
    type: PaginatedResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
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

    const result = await this.auditService.findAuditLogs(filters, user);
    
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
