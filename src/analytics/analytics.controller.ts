import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsPeriod } from '@prisma/client';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('property/:propertyId')
  getPropertyAnalytics(
    @Param('propertyId') propertyId: string,
    @Query('period') period: AnalyticsPeriod,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() userId: string,
  ) {
    return this.analyticsService.getPropertyAnalytics(
      propertyId,
      period,
      new Date(startDate),
      new Date(endDate),
      userId,
    );
  }

  @Get('financial')
  getFinancialAnalytics(
    @Query('period') period: AnalyticsPeriod,
    @CurrentUser() userId: string,
  ) {
    return this.analyticsService.getFinancialAnalytics(userId, period);
  }
}

