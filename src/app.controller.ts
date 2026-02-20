import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MongoDBService } from './database/mongodb.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly mongo: MongoDBService,
    private readonly prisma: PrismaService
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'real-estate-backend',
    };
  }

  @Get('health/stats')
  @ApiOperation({ summary: 'Get public statistics for homepage' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    try {
      // Use Prisma for properties and bookings
      const [properties, bookings, cities] = await Promise.all([
        this.prisma.property.count({ where: { status: 'ACTIVE' } }),
        this.prisma.booking.count({
          where: {
            status: 'COMPLETED',
            paymentStatus: 'COMPLETED',
          },
        }),
        this.prisma.property.findMany({
          where: { status: 'ACTIVE' },
          select: { city: true },
          distinct: ['city'],
        }),
      ]);

      return {
        success: true,
        data: {
          properties,
          happyGuests: bookings,
          cities: cities.length,
        },
      };
    } catch (error) {
      // Fallback to MongoDB if Prisma fails
      try {
        const propertiesCollection = this.mongo.getCollection('properties');
        const bookingsCollection = this.mongo.getCollection('bookings');

        const [propertiesCount, happyGuests, cities] = await Promise.all([
          propertiesCollection.countDocuments({ status: 'ACTIVE' }),
          bookingsCollection.countDocuments({
            status: 'COMPLETED',
            paymentStatus: 'COMPLETED',
          }),
          propertiesCollection.distinct('city', { status: 'ACTIVE' }),
        ]);

        return {
          success: true,
          data: {
            properties: propertiesCount,
            happyGuests,
            cities: cities.length,
          },
        };
      } catch (mongoError) {
        // Return default values if both fail
        return {
          success: true,
          data: {
            properties: 0,
            happyGuests: 0,
            cities: 0,
          },
        };
      }
    }
  }
}
