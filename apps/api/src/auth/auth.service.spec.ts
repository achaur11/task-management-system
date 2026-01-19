/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';

// Mock bcrypt before importing
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { LoginDto, RegisterDto, Role } from 'data';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let organizationRepository: jest.Mocked<Repository<Organization>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Test User',
    orgId: 'org-1',
    role: Role.Viewer,
    createdAt: new Date(),
    updatedAt: new Date(),
    org: null,
    createdTasks: [],
    auditLogs: [],
  };

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Organization',
    parentOrgId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    children: [],
    users: [],
    tasks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    organizationRepository = module.get(getRepositoryToken(Organization));
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const userWithOrg = { ...mockUser, org: mockOrganization };
      userRepository.findOne.mockResolvedValue(userWithOrg);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(userWithOrg);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['org'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    });

    it('should return null when user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
      expect(bcrypt.compare as jest.Mock).not.toHaveBeenCalled();
    });

    it('should return null when password is incorrect', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-password', 'hashed-password');
    });
  });

  describe('login', () => {
    it('should return access token and user data on successful login', async () => {
      const userWithOrg = { ...mockUser, org: mockOrganization };
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      userRepository.findOne.mockResolvedValue(userWithOrg);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'jwt-token',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          orgId: 'org-1',
          role: Role.Viewer,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        orgId: 'org-1',
        role: Role.Viewer,
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
      orgId: 'org-1',
      role: Role.Viewer,
    };

    it('should register a new user successfully', async () => {
      const savedUser = { ...mockUser, email: 'newuser@example.com', displayName: 'New User' };

      userRepository.findOne
        .mockResolvedValueOnce(null) // Check existing user
        .mockResolvedValueOnce(null); // This won't be called, but needed for type safety
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create.mockReturnValue(savedUser as any);
      userRepository.save.mockResolvedValue(savedUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'newuser@example.com',
          displayName: 'New User',
          orgId: 'org-1',
          role: Role.Viewer,
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });
      expect(organizationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'org-1' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(organizationRepository.findOne).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when organization does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should use default role Viewer when role is not provided', async () => {
      const registerDtoWithoutRole: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        orgId: 'org-1',
      };
      const savedUser = { ...mockUser, role: Role.Viewer };

      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.create.mockReturnValue(savedUser as any);
      userRepository.save.mockResolvedValue(savedUser);

      await service.register(registerDtoWithoutRole);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: Role.Viewer,
        }),
      );
    });

    it('should handle database constraint violation for duplicate email', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.save.mockRejectedValue({ code: '23505' }); // Unique constraint violation

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should handle foreign key constraint violation for invalid org', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.save.mockRejectedValue({ code: '23503' }); // Foreign key constraint violation

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('should handle unexpected errors', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.findOne.mockResolvedValue(mockOrganization);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      userRepository.save.mockRejectedValue(new Error('Unexpected error'));

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user data with organization', async () => {
      const userWithOrg = { ...mockUser, org: mockOrganization };

      const result = await service.getCurrentUser(userWithOrg);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: 'org-1',
        role: Role.Viewer,
        org: {
          id: 'org-1',
          name: 'Test Organization',
        },
      });
    });

    it('should return user data without organization when org is null', async () => {
      const result = await service.getCurrentUser(mockUser);

      expect(result).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: 'org-1',
        role: Role.Viewer,
        org: null,
      });
    });
  });
});

