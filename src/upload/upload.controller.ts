import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('room-image')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadRoomImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const imageUrl = await this.uploadService.uploadImage(file, folder || 'rooms');
    return {
      success: true,
      data: {
        url: imageUrl,
      },
    };
  }
}
