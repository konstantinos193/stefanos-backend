import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Public()
  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    const [propertiesCount, bookingsCount, properties] = await Promise.all([
      this.prisma.property.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.booking.count({
        where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      this.prisma.property.findMany({
        where: { 
          status: 'ACTIVE',
          city: { not: null }
        },
        select: { city: true },
      }),
    ]);

    // Get unique cities
    const uniqueCities = new Set(properties.map(p => p.city).filter(Boolean));

    return {
      success: true,
      data: {
        properties: propertiesCount,
        happyGuests: bookingsCount,
        cities: uniqueCities.size,
      },
    };
  }
}

