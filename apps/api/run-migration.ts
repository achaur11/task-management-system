import { DataSource } from 'typeorm';
import { InitialSchema1759277529589 } from './src/migrations/1759277529589-InitialSchema';

async function runMigration() {
  const isPostgres = process.env.DB_URL?.startsWith('postgres') ?? true;
  const dbUrl = process.env.DB_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/task_management';
  
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

    const migration = new InitialSchema1759277529589();
    await migration.up(dataSource.createQueryRunner());
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

runMigration();
