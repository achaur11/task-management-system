import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { OrgScopeInterceptor } from './org-scope.interceptor';

@Module({
  providers: [
    RolesGuard,
    OrgScopeInterceptor,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OrgScopeInterceptor,
    },
  ],
  exports: [RolesGuard, OrgScopeInterceptor],
})
export class RbacModule {}
