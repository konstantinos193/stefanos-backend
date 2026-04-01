import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AIInsightsService {
  constructor(private prisma: PrismaService) {}

  async getBookingInsights(propertyId?: string, roomId?: string, timeframe = '30d') {
    const endDate = new Date();
    const startDate = new Date();
    
    // Calculate date range based on timeframe
    if (timeframe === '7d') startDate.setDate(endDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(endDate.getDate() - 30);
    else if (timeframe === '90d') startDate.setDate(endDate.getDate() - 90);

    const insights = [];

    try {
      // Get recent bookings
      const bookings = await this.prisma.booking.findMany({
        where: {
          checkIn: { gte: startDate, lte: endDate },
          ...(propertyId && { propertyId }),
          ...(roomId && { roomId }),
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }
        },
        include: { property: true }
      });

      // Revenue insights
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

      // High-value pending bookings
      const highValuePending = await this.prisma.booking.count({
        where: {
          status: 'PENDING',
          totalPrice: { gt: avgBookingValue * 1.2 },
          ...(propertyId && { propertyId }),
          ...(roomId && { roomId })
        }
      });

      if (highValuePending > 0) {
        insights.push({
          type: 'revenue',
          title: 'High-Value Bookings Pending',
          description: `${highValuePending} bookings above average value awaiting confirmation`,
          urgency: 'high',
          actionable: true,
          impact: Math.round(avgBookingValue * 1.2 * highValuePending)
        });
      }

      // Occupancy insights
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const occupiedDays = bookings.reduce((sum, b) => {
        return sum + Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24));
      }, 0);
      const occupancyRate = totalDays > 0 ? occupiedDays / totalDays : 0;

      if (occupancyRate < 0.6) {
        insights.push({
          type: 'occupancy',
          title: 'Low Occupancy Alert',
          description: `Current occupancy is ${Math.round(occupancyRate * 100)}% - below optimal levels`,
          urgency: 'medium',
          actionable: true,
          impact: -Math.round(totalRevenue * 0.2)
        });
      }

      // Pricing insights
      if (bookings.length > 10) {
        const recentBookings = bookings.slice(-10);
        const avgPricePerNight = recentBookings.reduce((sum, b) => {
          const nights = Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24));
          return sum + (b.totalPrice / nights);
        }, 0) / recentBookings.length;

        insights.push({
          type: 'pricing',
          title: 'Pricing Optimization Available',
          description: `Average nightly rate: €${Math.round(avgPricePerNight)} - consider dynamic pricing`,
          urgency: 'low',
          actionable: true,
          impact: Math.round(avgPricePerNight * 0.1 * 30) // Potential 10% increase over 30 days
        });
      }

      return {
        success: true,
        data: insights
      };

    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        success: true,
        data: [{
          type: 'operational',
          title: 'Analysis Unavailable',
          description: 'Unable to generate insights at this time',
          urgency: 'low',
          actionable: false
        }]
      };
    }
  }

  async getRealTimeUpdates(since?: string) {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
      const recentBookings = await this.prisma.booking.findMany({
        where: {
          updatedAt: { gte: sinceDate },
        },
        include: { property: true },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      const updates = recentBookings.map(booking => ({
        type: booking.createdAt >= sinceDate ? 'booking_created' : 'booking_modified',
        timestamp: booking.updatedAt.toISOString(),
        data: {
          bookingId: booking.id,
          guestName: booking.guestName,
          propertyName: booking.property?.titleGr || booking.property?.titleEn,
          status: booking.status,
          message: this.getUpdateMessage(booking)
        }
      }));

      return {
        success: true,
        data: updates
      };

    } catch (error) {
      console.error('Error fetching updates:', error);
      return { success: true, data: [] };
    }
  }

  private getUpdateMessage(booking: any): string {
    if (booking.status === 'CANCELLED') {
      return `Booking cancelled: ${booking.guestName}`;
    }
    return `Booking updated: ${booking.guestName} - ${booking.property?.titleGr || booking.property?.titleEn}`;
  }
}
