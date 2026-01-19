import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validate } from '../config/env.validation';
import databaseConfig from '../config/database.config';
import { createDatabaseConfig } from '../config/database.factory';
import { AllExceptionsFilter } from '../common/filters/http-exception.filter';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { ValidationPipe as NestValidationPipe, BadRequestException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacModule } from 'auth';
import { TasksModule } from '../tasks/tasks.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      validate,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // This factory tests PostgreSQL connection first and falls back to SQLite if unavailable
        return await createDatabaseConfig(configService);
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    RbacModule,
    TasksModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
            {
              provide: APP_PIPE,
              useClass: NestValidationPipe,
              useValue: {
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
                transformOptions: {
                  enableImplicitConversion: true,
                },
                exceptionFactory: (errors) => {
                  const errorMessages = errors.map(error => ({
                    property: error.property,
                    constraints: error.constraints,
                    value: error.value
                  }));
                  console.error('Validation errors:', errorMessages);
                  return new BadRequestException({
                    message: 'Validation failed',
                    errors: errorMessages
                  });
                }
              },
            },
  ],
})
export class AppModule {}
