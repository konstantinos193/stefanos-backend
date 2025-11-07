import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: PaginationDto & { isActive?: string }) {
    return this.servicesService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single service' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create service' })
  @ApiResponse({ status: 201 })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle service status' })
  @ApiResponse({ status: 200 })
  toggle(@Param('id') id: string) {
    return this.servicesService.toggle(id);
  }
}

