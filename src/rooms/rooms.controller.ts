import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

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

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() userId?: string) {
    return this.roomsService.findOne(id, userId);
  }

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
}

