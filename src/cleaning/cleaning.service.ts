import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCleaningScheduleDto } from './dto/create-cleaning-schedule.dto';
import { CleaningFrequency } from '../../prisma/generated/prisma';

@Injectable()
export class CleaningService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(
    createScheduleDto: CreateCleaningScheduleDto,
    userId: string,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: createScheduleDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to create cleaning schedule');
    }

    // Calculate next cleaning based on frequency
    let nextCleaning = createScheduleDto.nextCleaning
      ? new Date(createScheduleDto.nextCleaning)
      : this.calculateNextCleaning(
          createScheduleDto.frequency,
          createScheduleDto.lastCleaned
            ? new Date(createScheduleDto.lastCleaned)
            : new Date(),
        );

    return this.prisma.cleaningSchedule.create({
      data: {
        ...createScheduleDto,
        ownerId: userId,
        lastCleaned: createScheduleDto.lastCleaned
          ? new Date(createScheduleDto.lastCleaned)
          : null,
        nextCleaning,
      },
      include: { property: true },
    });
  }

  async updateCleaningDate(
    scheduleId: string,
    cleanedDate: Date,
    userId: string,
  ) {
    const schedule = await this.prisma.cleaningSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Cleaning schedule not found');
    }

    if (schedule.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to update cleaning schedule');
    }

    const nextCleaning = this.calculateNextCleaning(
      schedule.frequency,
      cleanedDate,
    );

    // Update property's last cleaning date
    await this.prisma.property.update({
      where: { id: schedule.propertyId },
      data: { lastCleaningDate: cleanedDate },
    });

    return this.prisma.cleaningSchedule.update({
      where: { id: scheduleId },
      data: {
        lastCleaned: cleanedDate,
        nextCleaning,
      },
    });
  }

  async getPropertyCleanliness(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        reviews: {
          where: { cleanlinessRating: { not: null } },
          select: {
            cleanlinessRating: true,
            createdAt: true,
          },
        },
        cleaningSchedules: {
          orderBy: { lastCleaned: 'desc' },
          take: 1,
        },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const cleanlinessRatings = property.reviews
      .map((r) => r.cleanlinessRating)
      .filter((r) => r !== null) as number[];

    const averageCleanliness =
      cleanlinessRatings.length > 0
        ? cleanlinessRatings.reduce((sum, r) => sum + r, 0) /
          cleanlinessRatings.length
        : null;

    return {
      propertyId: property.id,
      averageCleanlinessRating: averageCleanliness
        ? Math.round(averageCleanliness * 100) / 100
        : null,
      totalRatings: cleanlinessRatings.length,
      lastCleaningDate: property.lastCleaningDate,
      nextCleaningDate:
        property.cleaningSchedules[0]?.nextCleaning || null,
      schedule: property.cleaningSchedules[0] || null,
    };
  }

  async getSchedulesByProperty(propertyId: string, userId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to view cleaning schedules');
    }

    return this.prisma.cleaningSchedule.findMany({
      where: { propertyId },
      orderBy: { nextCleaning: 'asc' },
    });
  }

  private calculateNextCleaning(
    frequency: CleaningFrequency,
    lastCleaned: Date,
  ): Date {
    const next = new Date(lastCleaned);

    switch (frequency) {
      case CleaningFrequency.AFTER_EACH_BOOKING:
        // Will be set when booking completes
        next.setDate(next.getDate() + 1);
        break;
      case CleaningFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case CleaningFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case CleaningFrequency.BIWEEKLY:
        next.setDate(next.getDate() + 14);
        break;
      case CleaningFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      default:
        next.setDate(next.getDate() + 7);
    }

    return next;
  }
}

