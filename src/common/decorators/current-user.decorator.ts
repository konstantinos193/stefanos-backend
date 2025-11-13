import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // Return userId for compatibility with existing code
    if (user) {
      return user.userId || user.id || user;
    }
    return null;
  },
);

