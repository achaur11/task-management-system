import { registerAs } from '@nestjs/config';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

export default registerAs('database', () => ({
  type: process.env.DB_URL?.startsWith('postgresql') ? 'postgres' : 'sqlite',
  url: process.env.DB_URL || 'sqlite://database.sqlite',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [Organization, User, Task, AuditLog],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: process.env.NODE_ENV === 'production',
}));
