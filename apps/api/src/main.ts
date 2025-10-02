/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { DataSource } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { User } from './entities/user.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { seedDatabase } from './seed/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend development
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Task Management System API')
    .setDescription('A secure task management system with RBAC and organization hierarchy')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Tasks', 'Task management operations')
    .addTag('Audit', 'Audit log operations')
    .addTag('Health', 'Application health check')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    },
    customSiteTitle: 'Task Management API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

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
    `Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`
  );
}

bootstrap();
