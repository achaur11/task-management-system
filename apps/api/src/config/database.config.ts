import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_URL?.startsWith('postgresql') ? 'postgres' : 'sqlite',
  url: process.env.DB_URL || 'sqlite://database.sqlite',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  autoLoadEntities: true,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: process.env.NODE_ENV === 'production',
}));
