import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MongoDBService } from './database/mongodb.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly mongo: MongoDBService) {}

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
    const propertiesCollection = this.mongo.getCollection('properties');
    const bookingsCollection = this.mongo.getCollection('bookings');

    const [properties, happyGuests, cities] = await Promise.all([
      // Count active properties
      propertiesCollection.countDocuments({ status: 'ACTIVE' }),
      // Count completed bookings (happy guests)
      bookingsCollection.countDocuments({
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
      }),
      // Count unique cities
      propertiesCollection.distinct('city', { status: 'ACTIVE' }),
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
