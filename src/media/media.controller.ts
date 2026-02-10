import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, MediaCategory } from '../database/types';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category?: MediaCategory,
    @Body('altTextGr') altTextGr?: string,
    @Body('altTextEn') altTextEn?: string
  ) {
    const media = await this.mediaService.upload(
      file,
      category || MediaCategory.GENERAL,
      altTextGr,
      altTextEn
    );
    return { success: true, data: media };
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROPERTY_OWNER)
  async findAll(@Query('category') category?: MediaCategory) {
    const media = await this.mediaService.findAll(category);
    return { success: true, data: media };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PROPERTY_OWNER)
  async findOne(@Param('id') id: string) {
    const media = await this.mediaService.findOne(id);
    return { success: true, data: media };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { success: true, message: 'Media deleted successfully' };
  }
}
