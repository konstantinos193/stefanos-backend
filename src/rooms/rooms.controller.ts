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
import { CurrentUserWithRole } from '../common/decorators/current-user-with-role.decorator';
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

  @Public()
  @Get('dashboard-stats')
  getDashboardStats() {
    return this.roomsService.getDashboardStats();
  }

  @Public()
  @Get('bookable')
  findAllBookable() {
    return this.roomsService.findAllBookable();
  }

  @Post()
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  create(@Body() createRoomDto: CreateRoomDto, @CurrentUserWithRole() user: any) {
    return this.roomsService.create(createRoomDto, user.userId || user.id);
  }

  @Get('property/:propertyId')
  findAll(
    @Param('propertyId') propertyId: string,
    @CurrentUserWithRole() user?: any,
  ) {
    return this.roomsService.findAll(propertyId, user?.userId || user?.id);
  }

  @Patch(':id')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  update(
    @Param('id') id: string,
    @Body() updateRoomDto: UpdateRoomDto,
    @CurrentUserWithRole() user: any,
  ) {
    return this.roomsService.update(id, updateRoomDto, user.userId || user.id, user.role);
  }

  @Delete(':id')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentUserWithRole() user: any) {
    return this.roomsService.remove(id, user.userId || user.id, user.role);
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
  findOne(@Param('id') id: string, @CurrentUserWithRole() user?: any) {
    return this.roomsService.findOne(id, user?.userId || user?.id);
  }
}

