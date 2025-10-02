import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuditService } from '../audit/audit.service';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, User, Organization, AuditLog]),
  ],
  controllers: [TasksController],
  providers: [TasksService, AuditService],
  exports: [TasksService, AuditService],
})
export class TasksModule {}
