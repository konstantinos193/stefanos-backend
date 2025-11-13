import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CleaningService } from './cleaning.service';
import { CreateCleaningScheduleDto } from './dto/create-cleaning-schedule.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('cleaning')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PROPERTY_OWNER', 'ADMIN')
export class CleaningController {
  constructor(private readonly cleaningService: CleaningService) {}

  @Post('schedule')
  createSchedule(
    @Body() createScheduleDto: CreateCleaningScheduleDto,
    @CurrentUser() userId: string,
  ) {
    return this.cleaningService.createSchedule(createScheduleDto, userId);
  }

  @Get('property/:propertyId')
  getPropertyCleanliness(@Param('propertyId') propertyId: string) {
    return this.cleaningService.getPropertyCleanliness(propertyId);
  }

  @Get('property/:propertyId/schedules')
  getSchedulesByProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser() userId: string,
  ) {
    return this.cleaningService.getSchedulesByProperty(propertyId, userId);
  }

  @Patch('schedule/:id/cleaned')
  updateCleaningDate(
    @Param('id') id: string,
    @Query('date') date: string,
    @CurrentUser() userId: string,
  ) {
    return this.cleaningService.updateCleaningDate(
      id,
      new Date(date),
      userId,
    );
  }
}

