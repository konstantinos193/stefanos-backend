import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EditionsService } from './editions.service';
import { CreateEditionDto } from './dto/create-edition.dto';
import { UpdateEditionDto } from './dto/update-edition.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Editions')
@Controller('editions')
export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all editions' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200 })
  findAll(@Query() query: PaginationDto & { category?: string; status?: string }) {
    return this.editionsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single edition' })
  @ApiResponse({ status: 200 })
  findOne(@Param('id') id: string) {
    return this.editionsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create edition' })
  @ApiResponse({ status: 201 })
  create(@Body() createEditionDto: CreateEditionDto) {
    return this.editionsService.create(createEditionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update edition' })
  @ApiResponse({ status: 200 })
  update(@Param('id') id: string, @Body() updateEditionDto: UpdateEditionDto) {
    return this.editionsService.update(id, updateEditionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete edition' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.editionsService.remove(id);
  }

  @Public()
  @Get('category/:category')
  @ApiOperation({ summary: 'Get editions by category' })
  @ApiResponse({ status: 200 })
  findByCategory(@Param('category') category: string, @Query() query: PaginationDto) {
    return this.editionsService.findByCategory(category, query);
  }
}

