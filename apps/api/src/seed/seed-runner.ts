import { DataSource, DataSourceOptions } from 'typeorm';
import { seedDatabase } from './seed';

async function runSeed() {
  const isPostgres = process.env.DB_URL?.startsWith('postgres') ?? true;
  const dbUrl = process.env.DB_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/task_management';
  
  const config = {
    type: isPostgres ? 'postgres' : 'sqlite',
    url: dbUrl,
    synchronize: false,
    logging: true,
    entities: ['src/entities/*.entity.ts'],
    migrations: ['src/migrations/*.ts'],
  } as DataSourceOptions;
  
  const dataSource = new DataSource(config);

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedDatabase(dataSource);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

runSeed();
