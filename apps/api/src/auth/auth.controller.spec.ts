import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from 'data';
import { User } from '../entities/user.entity';
import { Role } from 'data';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

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

  const mockLoginResponse = {
    accessToken: 'jwt-token',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      orgId: 'org-1',
      role: Role.Viewer,
    },
  };

  const mockRegisterResponse = {
    user: {
      id: 'user-1',
      email: 'newuser@example.com',
      displayName: 'New User',
      orgId: 'org-1',
      role: Role.Viewer,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            getCurrentUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        orgId: 'org-1',
        role: Role.Viewer,
      };

      authService.register.mockResolvedValue(mockRegisterResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockRegisterResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user and return token', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        orgId: 'org-1',
        role: Role.Viewer,
        org: null,
      };

      authService.getCurrentUser.mockResolvedValue(mockProfile);

      const result = await controller.getProfile({ user: mockUser });

      expect(result).toEqual(mockProfile);
      expect(authService.getCurrentUser).toHaveBeenCalledWith(mockUser);
    });
  });
});

