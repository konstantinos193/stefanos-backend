import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROPERTY_OWNER', 'ADMIN', 'MANAGER')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('propertyId') propertyId?: string,
    @CurrentUser() userId?: string,
  ) {
    return this.maintenanceService.findAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
      priority,
      propertyId,
      userId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.maintenanceService.findOne(id, userId);
  }

  @Post()
  create(
    @Body() createMaintenanceRequestDto: CreateMaintenanceRequestDto,
    @CurrentUser() userId: string,
  ) {
    return this.maintenanceService.create(createMaintenanceRequestDto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceRequestDto: UpdateMaintenanceRequestDto,
    @CurrentUser() userId: string,
  ) {
    return this.maintenanceService.update(id, updateMaintenanceRequestDto, userId);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body('assignedTo') assignedTo: string,
    @CurrentUser() userId: string,
  ) {
    return this.maintenanceService.assign(id, assignedTo, userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.maintenanceService.complete(id, userId);
  }
}
