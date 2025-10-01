/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { seedDatabase } from './seed/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Auto-seed in development if core tables are empty
  if (process.env.NODE_ENV !== 'production') {
    try {
      const dataSource = app.get(DataSource);
      const [orgCount, userCount, taskCount, auditCount] = await Promise.all([
        dataSource.getRepository(Organization).count(),
        dataSource.getRepository(User).count(),
        dataSource.getRepository(Task).count(),
        dataSource.getRepository(AuditLog).count(),
      ]);

      if (orgCount === 0 && userCount === 0 && taskCount === 0 && auditCount === 0) {
        Logger.log('Seeding database (empty tables detected)...');
        await seedDatabase(dataSource);
        Logger.log('Seeding complete.');
      }
    } catch (e) {
      Logger.error('Auto-seed failed', (e as Error).message);
    }
  }
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
