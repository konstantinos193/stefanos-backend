import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'PROPERTY_OWNER')
  @ApiOperation({ summary: 'Get all rooms (authenticated)' })
  findAllAuth() {
    return this.roomsService.findAllPublic();
  }

  @Public()
  @Get('public/all')
  findAllPublic() {
    return this.roomsService.findAllPublic();
  }

  @Public()
  @Get('public/occupancy')
  getOccupancy(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.roomsService.getOccupancyForRange(startDate, endDate);
  }

  @Public()
  @Get('public/search')
  findAvailablePublic(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('guests') guests?: string,
  ) {
    const parsedGuests = guests ? Number(guests) : undefined;
    return this.roomsService.findAvailablePublic(checkIn, checkOut, parsedGuests);
  }

  @Public()
  @Get('public/:id')
  findOnePublic(@Param('id') id: string) {
    return this.roomsService.findOnePublic(id);
  }

  @Get('dashboard-stats')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  getDashboardStats() {
    return this.roomsService.getDashboardStats();
  }

  @Get('bookable')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  findAllBookable() {
    return this.roomsService.findAllBookable();
  }

  @Post()
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  create(@Body() createRoomDto: CreateRoomDto, @CurrentUser() userId: string) {
    return this.roomsService.create(createRoomDto, userId);
  }

  @Get('property/:propertyId')
  findAll(
    @Param('propertyId') propertyId: string,
    @CurrentUser() userId?: string,
  ) {
    return this.roomsService.findAll(propertyId, userId);
  }

  @Patch(':id')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUser() userId: string,
  ) {
    return this.roomsService.update(id, updateRoomDto, userId);
  }

  @Delete(':id')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.roomsService.remove(id, userId);
  }

  @Public()
  @Get(':id/availability')
  getAvailability(
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.roomsService.getRoomAvailability(
      id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId?: string) {
    return this.roomsService.findOne(id, userId);
  }
}

