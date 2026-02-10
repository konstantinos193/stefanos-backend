import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { CreateLogDto } from './dto/create-log.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all audit logs with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of audit logs with pagination',
  })
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }

  @Get('actions')
  @ApiOperation({ summary: 'Get all distinct log action types' })
  @ApiResponse({
    status: 200,
    description: 'List of distinct action types (CREATE, UPDATE, DELETE, LOGIN, etc.)',
  })
  getActions() {
    return this.logsService.getActions();
  }

  @Get('entity-types')
  @ApiOperation({ summary: 'Get all distinct entity types' })
  @ApiResponse({
    status: 200,
    description: 'List of distinct entity types (Property, Booking, User, etc.)',
  })
  getEntityTypes() {
    return this.logsService.getEntityTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Audit log details' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  findOne(@Param('id') id: string) {
    return this.logsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new audit log entry' })
  @ApiResponse({ status: 201, description: 'Audit log created' })
  create(@Body() dto: CreateLogDto) {
    return this.logsService.create(dto);
  }

  @Delete('cleanup/:days')
  @ApiOperation({ summary: 'Delete audit logs older than specified number of days' })
  @ApiParam({ name: 'days', description: 'Delete logs older than this many days', example: 90 })
  @ApiResponse({ status: 200, description: 'Logs deleted successfully' })
  deleteOlderThan(@Param('days') days: number) {
    return this.logsService.deleteOlderThan(Number(days));
  }
}
