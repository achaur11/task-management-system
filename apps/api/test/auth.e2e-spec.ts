import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app/app.module';
import { User } from '../src/entities/user.entity';
import { Organization } from '../src/entities/organization.entity';
import { Task } from '../src/entities/task.entity';
import { AuditLog } from '../src/entities/audit-log.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await dataSource.getRepository(AuditLog).delete({});
    await dataSource.getRepository(Task).delete({});
    await dataSource.getRepository(User).delete({});
    await dataSource.getRepository(Organization).delete({});
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      // First create an organization
      const org = await dataSource.getRepository(Organization).save({
        name: 'Test Organization',
        parentOrgId: null,
      });

      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.data.user).toMatchObject({
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      });
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for duplicate email', async () => {
      // First create an organization
      const org = await dataSource.getRepository(Organization).save({
        name: 'Test Organization',
        parentOrgId: null,
      });

      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      };

      // Register first user
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201);

      // Try to register with same email
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should return 400 for invalid organization ID', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        orgId: 'invalid-org-id',
        role: 'Viewer',
      };

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    let org: Organization;
    let user: User;

    beforeEach(async () => {
      // Create organization and user for login tests
      org = await dataSource.getRepository(Organization).save({
        name: 'Test Organization',
        parentOrgId: null,
      });

      user = await dataSource.getRepository(User).save({
        email: 'test@example.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.s8i2', // 'password123'
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      });
    });

    it('should login with correct credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user).toMatchObject({
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    let org: Organization;
    let user: User;
    let accessToken: string;

    beforeEach(async () => {
      // Create organization and user
      org = await dataSource.getRepository(Organization).save({
        name: 'Test Organization',
        parentOrgId: null,
      });

      user = await dataSource.getRepository(User).save({
        email: 'test@example.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.s8i2', // 'password123'
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      });

      // Login to get token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: user.id,
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: org.id,
        role: 'Viewer',
      });
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should protect non-auth routes by default', async () => {
      // Try to access a protected route without token
      await request(app.getHttpServer())
        .get('/api/protected-route')
        .expect(401);
    });

    it('should allow access to public routes', async () => {
      // The root route is marked as public
      await request(app.getHttpServer())
        .get('/api')
        .expect(200);
    });
  });
});
