import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { LoginDto, RegisterDto, Role } from 'data';
import { JwtPayload } from './strategies/jwt.strategy';

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    orgId: string;
    role: string;
  };
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    orgId: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['org'],
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: user.orgId,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Verify organization exists
      const organization = await this.organizationRepository.findOne({
        where: { id: registerDto.orgId },
      });

      if (!organization) {
        throw new BadRequestException('Invalid organization ID');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

      // Create user
      const user = this.userRepository.create({
        email: registerDto.email,
        passwordHash,
        displayName: registerDto.displayName,
        orgId: registerDto.orgId,
        role: registerDto.role || Role.Viewer,
      });

      const savedUser = await this.userRepository.save(user);

      return {
        user: {
          id: savedUser.id,
          email: savedUser.email,
          displayName: savedUser.displayName,
          orgId: savedUser.orgId,
          role: savedUser.role,
        },
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle database constraint violations
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException('User with this email already exists');
      }
      
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Invalid organization ID');
      }
      
      // Log unexpected errors and throw generic error
      console.error('Registration error:', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async getCurrentUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      orgId: user.orgId,
      role: user.role,
      org: user.org ? {
        id: user.org.id,
        name: user.org.name,
      } : null,
    };
  }
}
