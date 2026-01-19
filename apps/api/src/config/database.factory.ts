import { Logger } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Tests PostgreSQL connection with timeout to avoid hanging
 */
async function testPostgresConnection(url: string, timeoutMs: number = 3000): Promise<boolean> {
  let testDataSource: DataSource | null = null;
  
  try {
    testDataSource = new DataSource({
      type: 'postgres',
      url,
      // Add extra options for connection timeout
      extra: {
        connectionTimeoutMillis: timeoutMs,
      },
      // Minimal config for connection test
      entities: [],
    } as DataSourceOptions);

    // Create a promise that times out
    const connectionPromise = testDataSource.initialize();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), timeoutMs);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    
    // If we get here, connection succeeded
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
    }
    return true;
  } catch (error) {
    // Clean up if connection was partially initialized
    if (testDataSource?.isInitialized) {
      try {
        await testDataSource.destroy();
      } catch {
        // Ignore destroy errors
      }
    }
    return false;
  }
}

/**
 * Database configuration factory with automatic PostgreSQL fallback to SQLite
 */
export async function createDatabaseConfig(
  configService: ConfigService,
): Promise<DataSourceOptions> {
  const logger = new Logger('DatabaseConfig');
  const dbUrl = configService.get<string>('DB_URL');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // If DB_URL explicitly points to SQLite, use it
  if (dbUrl && dbUrl.startsWith('sqlite://')) {
    logger.log('Using SQLite database (explicitly configured)');
    return {
      type: 'sqlite',
      database: dbUrl.replace('sqlite://', ''),
      synchronize: nodeEnv !== 'production',
      logging: nodeEnv === 'development',
      entities: [Organization, User, Task, AuditLog],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: nodeEnv === 'production',
    };
  }

  // Try PostgreSQL if DB_URL is set or use default
  const postgresUrl =
    dbUrl || 'postgresql://postgres:mysecretpassword@localhost:5432/task_management';

  if (!dbUrl || postgresUrl.startsWith('postgres')) {
    logger.log('Attempting to connect to PostgreSQL...');
    
    try {
      const isConnected = await testPostgresConnection(postgresUrl);
      
      if (isConnected) {
        logger.log('✅ Successfully connected to PostgreSQL');
        return {
          type: 'postgres',
          url: postgresUrl,
          synchronize: nodeEnv !== 'production',
          logging: nodeEnv === 'development',
          entities: [Organization, User, Task, AuditLog],
          migrations: ['dist/migrations/*.js'],
          migrationsRun: nodeEnv === 'production',
        };
      }
    } catch (error) {
      logger.warn(`⚠️  PostgreSQL connection failed: ${(error as Error).message}`);
    }

    // Fallback to SQLite
    logger.warn('⚠️  PostgreSQL unavailable, falling back to SQLite');
    logger.log('Using SQLite database at: database.sqlite');
    
    return {
      type: 'sqlite',
      database: 'database.sqlite',
      synchronize: nodeEnv !== 'production',
      logging: nodeEnv === 'development',
      entities: [Organization, User, Task, AuditLog],
      migrations: ['dist/migrations/*.js'],
      migrationsRun: nodeEnv === 'production',
    };
  }

  // Default to SQLite if URL is invalid
  logger.log('Using SQLite database (default)');
  return {
    type: 'sqlite',
    database: 'database.sqlite',
    synchronize: nodeEnv !== 'production',
    logging: nodeEnv === 'development',
    entities: [Organization, User, Task, AuditLog],
    migrations: ['dist/migrations/*.js'],
    migrationsRun: nodeEnv === 'production',
  };
}
