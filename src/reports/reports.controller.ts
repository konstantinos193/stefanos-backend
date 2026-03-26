import { Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../database/types';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROPERTY_OWNER, UserRole.MANAGER)
  async getReports(@CurrentUser() userId: string) {
    return this.reportsService.getReports(userId);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.PROPERTY_OWNER, UserRole.MANAGER)
  @HttpCode(HttpStatus.ACCEPTED)
  async generateReport(
    @Query('type') type: string,
    @Query('period') period: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() userId: string,
  ) {
    const resolvedDates = this.resolveDateRange(period, startDate, endDate);
    return this.reportsService.generateReport(
      type,
      period,
      resolvedDates.start,
      resolvedDates.end,
      userId,
    );
  }

  private resolveDateRange(period: string, startDate: string, endDate: string): { start: Date; end: Date } {
    const now = new Date();
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end };
      }
    }
    // Compute range from period
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;
    switch (period?.toUpperCase()) {
      case 'DAILY':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'WEEKLY':
        start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        break;
      case 'YEARLY':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'MONTHLY':
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
    }
    return { start, end };
  }

  @Get('download/:reportId')
  @Roles(UserRole.ADMIN, UserRole.PROPERTY_OWNER, UserRole.MANAGER)
  async downloadReport(@Param('reportId') reportId: string, @CurrentUser() userId: string) {
    return this.reportsService.downloadReport(reportId, userId);
  }

  @Get('types')
  @Roles(UserRole.ADMIN, UserRole.PROPERTY_OWNER, UserRole.MANAGER)
  async getReportTypes() {
    return this.reportsService.getReportTypes();
  }
}
