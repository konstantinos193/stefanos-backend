import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: PaginationDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single booking' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create booking' })
  @ApiResponse({ status: 201 })
  create(@Body() createBookingDto: CreateBookingDto, @CurrentUser() user: any) {
    return this.bookingsService.create(createBookingDto, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200 })
  cancel(@Param('id') id: string, @Body() cancelBookingDto: CancelBookingDto) {
    return this.bookingsService.cancel(id, cancelBookingDto);
  }
}

