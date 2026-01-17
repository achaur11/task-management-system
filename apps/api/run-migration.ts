import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { InitialSchema1759277529589 } from './src/migrations/1759277529589-InitialSchema';

// Load environment variables from .env file
dotenvConfig({ path: resolve(__dirname, '.env') });

async function ensureDatabaseExists(dbUrl: string): Promise<void> {
  const isPostgres = dbUrl?.startsWith('postgres') ?? true;
  
  if (!isPostgres) {
    // SQLite doesn't need database creation
    return;
  }

  try {
    // Parse the database URL to extract components
    const url = new URL(dbUrl);
    const databaseName = url.pathname.slice(1); // Remove leading '/'
    
    if (!databaseName) {
      console.log('⚠️  No database name found in DB_URL, skipping database creation check');
      return;
    }

    // Create a connection URL to the default 'postgres' database
    url.pathname = '/postgres';
    const adminUrl = url.toString();

    console.log(`🔍 Checking if database '${databaseName}' exists...`);
    
    // Connect to the default postgres database to check/create the target database
    const adminDataSource = new DataSource({
      type: 'postgres',
      url: adminUrl,
      synchronize: false,
      logging: false,
    } as any);

    await adminDataSource.initialize();
    const adminQueryRunner = adminDataSource.createQueryRunner();
    await adminQueryRunner.connect();

    // Check if database exists
    const result = await adminQueryRunner.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    if (result.length === 0) {
      console.log(`📦 Creating database '${databaseName}'...`);
      await adminQueryRunner.query(`CREATE DATABASE "${databaseName}"`);
      console.log(`✅ Database '${databaseName}' created successfully!`);
    } else {
      console.log(`✅ Database '${databaseName}' already exists`);
    }

    await adminQueryRunner.release();
    await adminDataSource.destroy();
  } catch (error) {
    console.error('⚠️  Error checking/creating database:', error);
    // Don't fail the migration if database creation check fails
    // It might already exist or there might be permission issues
  }
}

async function runMigration() {
  console.log('Running migration...');
  console.log('DB_URL:', process.env.DB_URL);
  const isPostgres = process.env.DB_URL?.startsWith('postgres') ?? true;
  const dbUrl = process.env.DB_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/task_management';
  
  // Ensure the database exists before proceeding
  await ensureDatabaseExists(dbUrl);
  
  const config = {
    type: isPostgres ? 'postgres' : 'sqlite',
    url: dbUrl,
    synchronize: false,
    logging: true,
    entities: ['src/entities/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  } as any;
  
  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    // Check if tables already exist
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Enable UUID extension for PostgreSQL (required for uuid_generate_v4())
    if (isPostgres) {
      try {
        console.log('🔧 Enabling uuid-ossp extension...');
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        console.log('✅ UUID extension enabled');
      } catch (error) {
        console.error('⚠️  Warning: Could not enable uuid-ossp extension:', error);
        // Continue anyway - the extension might already be enabled or there might be permission issues
      }
    }
    
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'tasks', 'audit_logs')
    `);
    
    if (tables.length > 0) {
      console.log('⚠️  Tables already exist. Skipping migration.');
      console.log('Found tables:', tables.map((t: { table_name: string }) => t.table_name).join(', '));
    } else {
      console.log('📋 Running migration...');
      const migration = new InitialSchema1759277529589();
      await migration.up(queryRunner);
      console.log('✅ Migration completed successfully!');
    }
    
    await queryRunner.release();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

runMigration();
