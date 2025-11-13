import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

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
    const [properties, happyGuests, cities] = await Promise.all([
      // Count active properties
      this.prisma.property.count({
        where: { status: 'ACTIVE' },
      }),
      // Count completed bookings (happy guests)
      this.prisma.booking.count({
        where: {
          status: 'COMPLETED',
          paymentStatus: 'COMPLETED',
        },
      }),
      // Count unique cities
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
        happyGuests,
        cities: cities.length,
      },
    };
  }
}
