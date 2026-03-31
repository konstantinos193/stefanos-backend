import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingType } from '../database/types';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(group?: string) {
    const where: any = {};
    if (group) where.group = group;

    return this.prisma.setting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async findOne(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return setting;
  }

  async getValue(key: string, defaultValue?: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    return setting?.value ?? defaultValue ?? null;
  }

  async setValue(
    key: string,
    value: string,
    type: SettingType = SettingType.STRING,
    group: string = 'general',
    description?: string
  ) {
    const existing = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (existing) {
      return this.prisma.setting.update({
        where: { key },
        data: { value, type, group, description },
      });
    }

    return this.prisma.setting.create({
      data: {
        key,
        value,
        type,
        group,
        description,
      },
    });
  }

  async update(key: string, data: { value?: string; type?: SettingType; group?: string; description?: string }) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    return this.prisma.setting.update({
      where: { key },
      data,
    });
  }

  async remove(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key '${key}' not found`);
    }

    await this.prisma.setting.delete({
      where: { key },
    });

    return { message: 'Setting deleted successfully' };
  }

  // Helper methods for common settings
  async getHotelInfo() {
    const keys = [
      'hotel_name',
      'hotel_address',
      'hotel_phone',
      'hotel_email',
      'check_in_time',
      'check_out_time',
    ];

    const settings = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  }

  private readonly TAX_KEY = 'tax_settings';
  private readonly TAX_DEFAULTS = { vatRate: 0, municipalFee: 0, environmentalTax: 0, isActive: false };

  async getTaxSettings() {
    const setting = await this.prisma.setting.findUnique({ where: { key: this.TAX_KEY } });
    const stored = setting ? JSON.parse(setting.value) : {};
    return {
      id: setting?.id ?? this.TAX_KEY,
      ...this.TAX_DEFAULTS,
      ...stored,
      createdAt: setting?.createdAt ?? new Date().toISOString(),
      updatedAt: setting?.updatedAt ?? new Date().toISOString(),
    };
  }

  async updateTaxSettings(data: { vatRate?: number; municipalFee?: number; environmentalTax?: number; isActive?: boolean }) {
    const current = await this.getTaxSettings();
    const merged = { vatRate: current.vatRate, municipalFee: current.municipalFee, environmentalTax: current.environmentalTax, isActive: current.isActive, ...data };

    const setting = await this.prisma.setting.upsert({
      where: { key: this.TAX_KEY },
      create: { key: this.TAX_KEY, value: JSON.stringify(merged), type: SettingType.JSON, group: 'taxes', description: 'Tax settings' },
      update: { value: JSON.stringify(merged) },
    });

    return { id: setting.id, ...merged, createdAt: setting.createdAt, updatedAt: setting.updatedAt };
  }

  async getSocialLinks() {
    const keys = ['facebook_url', 'instagram_url', 'twitter_url', 'tripadvisor_url'];

    const settings = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  }
}
