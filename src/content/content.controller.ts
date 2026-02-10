import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto, ContentQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../database/types';

@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async create(@Body() createContentDto: CreateContentDto) {
    const content = await this.contentService.create(createContentDto);
    return { success: true, data: content };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROPERTY_OWNER)
  async findAll(@Query() query: ContentQueryDto) {
    const result = await this.contentService.findAll(query);
    return { success: true, data: result.data, pagination: result.pagination };
  }

  @Get('page/:page')
  async findByPage(@Param('page') page: string, @Query('active') active?: string) {
    const content = await this.contentService.findByPage(
      page,
      active !== 'false'
    );
    return { success: true, data: content };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROPERTY_OWNER)
  async findOne(@Param('id') id: string) {
    const content = await this.contentService.findOne(id);
    return { success: true, data: content };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto
  ) {
    const content = await this.contentService.update(id, updateContentDto);
    return { success: true, data: content };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(@Param('id') id: string) {
    await this.contentService.remove(id);
    return { success: true, message: 'Content deleted successfully' };
  }

  @Post(':id/media/:mediaId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async addMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Query('order') order?: string
  ) {
    const result = await this.contentService.addMediaToContent(
      id,
      mediaId,
      order ? parseInt(order, 10) : undefined
    );
    return { success: true, data: result };
  }

  @Delete(':id/media/:mediaId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async removeMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string
  ) {
    await this.contentService.removeMediaFromContent(id, mediaId);
    return { success: true, message: 'Media removed from content' };
  }
}
