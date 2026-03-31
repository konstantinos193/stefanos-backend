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
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, SettingType } from '../database/types';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findAll(@Query('group') group?: string) {
    const settings = await this.settingsService.findAll(group);
    return { success: true, data: settings };
  }

  @Get('hotel-info')
  async getHotelInfo() {
    const info = await this.settingsService.getHotelInfo();
    return { success: true, data: info };
  }

  @Get('social-links')
  async getSocialLinks() {
    const links = await this.settingsService.getSocialLinks();
    return { success: true, data: links };
  }

  @Get('taxes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getTaxSettings() {
    const taxes = await this.settingsService.getTaxSettings();
    return { success: true, data: taxes };
  }

  @Patch('taxes')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async updateTaxSettings(
    @Body() data: { vatRate?: number; municipalFee?: number; environmentalTax?: number; isActive?: boolean },
  ) {
    const taxes = await this.settingsService.updateTaxSettings(data);
    return { success: true, data: taxes };
  }

  @Get(':key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async findOne(@Param('key') key: string) {
    const setting = await this.settingsService.findOne(key);
    return { success: true, data: setting };
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body('key') key: string,
    @Body('value') value: string,
    @Body('type') type: SettingType,
    @Body('group') group: string,
    @Body('description') description?: string
  ) {
    const setting = await this.settingsService.setValue(key, value, type, group, description);
    return { success: true, data: setting };
  }

  @Patch(':key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async update(
    @Param('key') key: string,
    @Body() data: { value?: string; type?: SettingType; group?: string; description?: string }
  ) {
    const setting = await this.settingsService.update(key, data);
    return { success: true, data: setting };
  }

  @Delete(':key')
  @Roles(UserRole.ADMIN)
  async remove(@Param('key') key: string) {
    await this.settingsService.remove(key);
    return { success: true, message: 'Setting deleted successfully' };
  }
}
