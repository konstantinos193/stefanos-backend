import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  async getAuditLogs(@Query() query: AuditLogsQueryDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({ status: 200, description: 'Audit log statistics retrieved successfully' })
  async getAuditStats() {
    return this.auditService.getAuditStats();
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export audit logs to CSV' })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  async exportAuditLogs(@Query() query: AuditLogsQueryDto) {
    return this.auditService.exportAuditLogs(query);
  }
}
