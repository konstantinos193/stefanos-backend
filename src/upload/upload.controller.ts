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

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('room-image')
  @Roles('PROPERTY_OWNER', 'ADMIN')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }))
  async uploadRoomImage(
    @UploadedFile() file: UploadedFile,
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
