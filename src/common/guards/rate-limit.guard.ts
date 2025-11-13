import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.user?.userId || req.ip || req.connection?.remoteAddress;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Too many requests, please try again later',
        retryAfter: this.getRetryAfter(context),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private getRetryAfter(context: ExecutionContext): number {
    const request = context.switchToHttp().getRequest();
    const ttl = request._rateLimitTtl || 60;
    return Math.ceil(ttl / 1000);
  }
}

