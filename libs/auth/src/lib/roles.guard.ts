import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from 'data';
import { hasRole } from './rbac.util';
import { User } from './auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }
    
    if (!hasRole(user.role, requiredRoles)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}
