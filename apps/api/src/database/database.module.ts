import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Task,
      AuditLog,
    ]),
  ],
  exports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      Task,
      AuditLog,
    ]),
  ],
})
export class DatabaseModule {}
