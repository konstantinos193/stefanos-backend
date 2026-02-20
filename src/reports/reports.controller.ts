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
    return this.reportsService.generateReport(
      type,
      period,
      new Date(startDate),
      new Date(endDate),
      userId,
    );
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
