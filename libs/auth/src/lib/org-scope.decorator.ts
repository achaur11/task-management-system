import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrgScopeData } from './auth.types';

export const OrgScope = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): OrgScopeData => {
    const request = ctx.switchToHttp().getRequest();
    return request.orgScope;
  },
);
