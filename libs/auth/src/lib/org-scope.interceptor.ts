import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ORG_SCOPED_KEY } from './org-scoped.decorator';
import { getUserAccessibleOrgIds } from './org.util';
import { User } from './auth.types';

@Injectable()
export class OrgScopeInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isOrgScoped = this.reflector.getAllAndOverride<boolean>(ORG_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isOrgScoped) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      return next.handle();
    }

    // Add org scope to request for use in services
    const accessibleOrgIds = getUserAccessibleOrgIds(user.orgId);
    request.orgScope = {
      userOrgId: user.orgId,
      accessibleOrgIds,
      user,
    };

    return next.handle();
  }
}
