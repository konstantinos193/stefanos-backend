import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUserWithRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Always return the full user object with role
    return user;
  },
);
