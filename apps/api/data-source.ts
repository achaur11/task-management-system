const { DataSource } = require('typeorm');

const isPostgres = process.env.DB_URL?.startsWith('postgres') ?? true;
const dbUrl = process.env.DB_URL || 'postgresql://postgres:mysecretpassword@localhost:5432/task_management';

const AppDataSource = new DataSource({
  type: isPostgres ? 'postgres' : 'sqlite',
  url: dbUrl,
  synchronize: false,
  logging: true,
  entities: ['src/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscriber/*.ts'],
});

module.exports = { AppDataSource };
