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
import { CreatePricingRuleDto, UpdatePricingRuleDto } from './dto/create-pricing-rule.dto';
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
    @Query('adults') adults?: string,
    @Query('children') children?: string,
  ) {
    const parsedGuests = guests ? Number(guests) : undefined;
    const parsedAdults = adults !== undefined ? Number(adults) : undefined;
    const parsedChildren = children !== undefined ? Number(children) : undefined;
    return this.roomsService.findAvailablePublic(checkIn, checkOut, parsedGuests, parsedAdults, parsedChildren);
  }

  @Public()
  @Get('public/min-price')
  getMinPrice() {
    return this.roomsService.getMinPrice();
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

  @Get(':id/pricing-rules')
  @Roles('PROPERTY_OWNER', 'ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  getPricingRules(@Param('id') id: string) {
    return this.roomsService.getPricingRules(id);
  }

  @Post(':id/pricing-rules')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  createPricingRule(@Param('id') id: string, @Body() dto: CreatePricingRuleDto) {
    return this.roomsService.createPricingRule(id, dto);
  }

  @Patch(':id/pricing-rules/:ruleId')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  updatePricingRule(
    @Param('id') id: string,
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdatePricingRuleDto,
  ) {
    return this.roomsService.updatePricingRule(id, ruleId, dto);
  }

  @Delete(':id/pricing-rules/:ruleId')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  deletePricingRule(@Param('id') id: string, @Param('ruleId') ruleId: string) {
    return this.roomsService.deletePricingRule(id, ruleId);
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

  @Get(':id/availability-calendar')
  @Roles('PROPERTY_OWNER', 'ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  getAvailabilityCalendar(
    @Param('id') id: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.roomsService.getAvailabilityCalendar(id, Number(year), Number(month));
  }

  @Patch(':id/availability')
  @Roles('PROPERTY_OWNER', 'ADMIN', 'MANAGER')
  @UseGuards(RolesGuard)
  updateAvailability(
    @Param('id') id: string,
    @Body() body: { isAvailable: boolean; startDate: string; endDate: string; reason?: string },
  ) {
    return this.roomsService.updateAvailability(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUserWithRole() user?: any) {
    return this.roomsService.findOne(id, user?.userId || user?.id);
  }
}

