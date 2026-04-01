import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { getPagination } from '../common/utils/pagination.util';
import { FinancialUtil } from '../common/utils/financial.util';
import { PaymentStatus } from '../database/types';
import { EmailService } from '../email/email.service';
import Stripe from 'stripe';

interface AIInsight {
  type: 'revenue' | 'occupancy' | 'pricing' | 'maintenance' | 'guest_experience' | 'operational';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  actionable: boolean;
  impact?: number;
  confidence?: number;
  recommendations?: string[];
  bookingId?: string;
  roomId?: string;
}

interface RealTimeUpdate {
  type: 'booking_created' | 'booking_cancelled' | 'booking_modified' | 'room_status_change' | 'price_change';
  timestamp: string;
  data: any;
  userId?: string;
}

@Injectable()
export class EnhancedBookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getAIInsights(query: any): Promise<{ success: boolean; data: AIInsight[] }> {
    const { propertyId, roomId, timeframe = '30d' } = query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    if (timeframe === '7d') startDate.setDate(endDate.getDate() - 7);
    else if (timeframe === '30d') startDate.setDate(endDate.getDate() - 30);
    else if (timeframe === '90d') startDate.setDate(endDate.getDate() - 90);

    const insights: AIInsight[] = [];

    try {
      // Get booking data for analysis
      const bookings = await this.prisma.booking.findMany({
        where: {
          checkIn: { gte: startDate, lte: endDate },
          ...(propertyId && { propertyId }),
          ...(roomId && { roomId }),
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] }
        },
        include: { property: true, guest: true }
      });

      // Revenue Insights
      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const avgBookingValue = totalRevenue / bookings.length;
      
      // High-value bookings pending confirmation
      const highValuePending = await this.prisma.booking.count({
        where: {
          status: 'PENDING',
          totalPrice: { gt: avgBookingValue * 1.5 },
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
          impact: Math.round(avgBookingValue * 1.5 * highValuePending),
          confidence: 0.95,
          recommendations: ['Contact guests immediately', 'Offer expedited confirmation', 'Send personalized welcome message']
        });
      }

      // Occupancy Insights
      const rooms = await this.prisma.room.findMany({
        where: propertyId ? { propertyId } : {},
      });

      // Get bookings for each room separately
      const roomBookings = await Promise.all(
        rooms.map(async (room) => {
          const bookings = await this.prisma.booking.findMany({
            where: {
              roomId: room.id,
              checkIn: { gte: startDate, lte: endDate },
              status: { in: ['CONFIRMED', 'CHECKED_IN'] }
            }
          });
          return { ...room, bookings };
        })
      );

      const lowOccupancyRooms = roomBookings.filter(room => {
        const occupiedDays = room.bookings.reduce((sum, b) => {
          const nights = Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24));
          return sum + nights;
        }, 0);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const occupancyRate = occupiedDays / totalDays;
        return occupancyRate < 0.6; // Less than 60% occupancy
      });

      if (lowOccupancyRooms.length > 0) {
        insights.push({
          type: 'occupancy',
          title: 'Low Occupancy Detected',
          description: `${lowOccupancyRooms.length} rooms showing below 60% occupancy`,
          urgency: 'medium',
          actionable: true,
          impact: -Math.round(totalRevenue * 0.2), // Potential 20% revenue loss
          confidence: 0.88,
          recommendations: ['Adjust pricing strategy', 'Increase marketing efforts', 'Offer promotional rates']
        });
      }

      // Pricing Insights
      const recentBookings = bookings.slice(-20); // Last 20 bookings
      const avgRecentPrice = recentBookings.reduce((sum, b) => sum + (b.totalPrice / Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24))), 0) / recentBookings.length;
      
      // Check if weekend rates could be increased
      const weekendBookings = bookings.filter(b => {
        const checkIn = new Date(b.checkIn);
        return checkIn.getDay() === 5 || checkIn.getDay() === 6; // Friday or Saturday
      });
      
      if (weekendBookings.length > 5) {
        insights.push({
          type: 'pricing',
          title: 'Weekend Pricing Opportunity',
          description: 'High weekend demand suggests rate optimization potential',
          urgency: 'low',
          actionable: true,
          impact: Math.round(avgRecentPrice * 0.15 * weekendBookings.length), // 15% increase potential
          confidence: 0.75,
          recommendations: ['Increase weekend rates by 10-20%', 'Implement dynamic pricing', 'Create weekend packages']
        });
      }

      // Guest Experience Insights
      const groupBookings = bookings.filter(b => b.guests > 4);
      if (groupBookings.length > 0) {
        insights.push({
          type: 'guest_experience',
          title: 'Group Booking Upsell Opportunity',
          description: `${groupBookings.length} group bookings detected - upsell services available`,
          urgency: 'medium',
          actionable: true,
          impact: Math.round(groupBookings.length * 150), // Potential €150 per group
          confidence: 0.82,
          recommendations: ['Offer extra services', 'Provide group discounts', 'Suggest local activities']
        });
      }

      // Operational Insights
      const checkoutsToday = await this.prisma.booking.count({
        where: {
          checkOut: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'CHECKED_IN'
        }
      });

      if (checkoutsToday > 3) {
        insights.push({
          type: 'operational',
          title: 'High Checkout Volume Today',
          description: `${checkoutsToday} checkouts scheduled - ensure cleaning readiness`,
          urgency: 'high',
          actionable: true,
          confidence: 0.99,
          recommendations: ['Schedule additional cleaning staff', 'Prepare room turnover supplies', 'Coordinate with maintenance team']
        });
      }

      return {
        success: true,
        data: insights.sort((a, b) => {
          const urgencyOrder = { high: 3, medium: 2, low: 1 };
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        })
      };

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        success: true,
        data: [{
          type: 'operational',
          title: 'Analysis Unavailable',
          description: 'Unable to generate insights at this time',
          urgency: 'low',
          actionable: false,
          confidence: 0
        }]
      };
    }
  }

  async getRealTimeUpdates(since?: string): Promise<{ success: boolean; data: RealTimeUpdate[] }> {
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours if no since date
    
    try {
      const recentBookings = await this.prisma.booking.findMany({
        where: {
          updatedAt: { gte: sinceDate },
        },
        include: { property: true, guest: true },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      const updates: RealTimeUpdate[] = recentBookings.map(booking => {
        let updateType: RealTimeUpdate['type'] = 'booking_modified';
        
        if (booking.createdAt >= sinceDate) {
          updateType = 'booking_created';
        } else if (booking.status === 'CANCELLED') {
          updateType = 'booking_cancelled';
        }

        return {
          type: updateType,
          timestamp: booking.updatedAt.toISOString(),
          data: {
            bookingId: booking.id,
            guestName: booking.guestName,
            propertyName: booking.property?.titleGr || booking.property?.titleEn,
            status: booking.status,
            totalPrice: booking.totalPrice,
            message: this.generateUpdateMessage(updateType, booking)
          }
        };
      });

      return {
        success: true,
        data: updates
      };

    } catch (error) {
      console.error('Error fetching real-time updates:', error);
      return {
        success: true,
        data: []
      };
    }
  }

  async reschedule(id: string, rescheduleDto: RescheduleBookingDto, userId: string): Promise<any> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { property: true, guest: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('Unauthorized to reschedule this booking');
    }

    const newCheckIn = new Date(rescheduleDto.newCheckIn);
    const newCheckOut = rescheduleDto.newCheckOut ? new Date(rescheduleDto.newCheckOut) : booking.checkOut;

    // Validate dates
    if (newCheckIn >= newCheckOut) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    if (newCheckIn < new Date()) {
      throw new BadRequestException('Cannot reschedule to past dates');
    }

    // Check availability for new dates
    const conflictWhere: any = {
      id: { not: booking.id }, // Exclude current booking
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      OR: [{ checkIn: { lte: newCheckOut }, checkOut: { gte: newCheckIn } }],
    };

    if (rescheduleDto.roomId) {
      conflictWhere.roomId = rescheduleDto.roomId;
    } else {
      conflictWhere.roomId = booking.roomId;
      conflictWhere.propertyId = booking.propertyId;
    }

    const conflictingBookings = await this.prisma.booking.findMany({ where: conflictWhere });

    if (conflictingBookings.length > 0) {
      throw new BadRequestException('Selected dates are not available');
    }

    // Calculate new pricing if dates changed
    let newTotalPrice = booking.totalPrice;
    if (newCheckIn.getTime() !== booking.checkIn.getTime() || newCheckOut.getTime() !== booking.checkOut.getTime()) {
      const originalNights = Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const newNights = Math.ceil((newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      
      if (originalNights !== newNights) {
        const pricePerNight = booking.totalPrice / originalNights;
        newTotalPrice = pricePerNight * newNights;
      }
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        totalPrice: newTotalPrice,
        basePrice: newTotalPrice,
        roomId: rescheduleDto.roomId || booking.roomId,
        ...(rescheduleDto.roomId && {
          roomName: (await this.prisma.room.findUnique({ where: { id: rescheduleDto.roomId } }))?.name
        })
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send notification email if requested
    if (rescheduleDto.notifyGuest && booking.guestEmail) {
      await this.emailService.sendBookingRescheduleNotification({
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        bookingId: booking.id,
        originalDates: { checkIn: booking.checkIn, checkOut: booking.checkOut },
        newDates: { checkIn: newCheckIn, checkOut: newCheckOut },
        propertyName: booking.property?.titleGr || booking.property?.titleEn,
        totalPrice: newTotalPrice,
        reason: rescheduleDto.reason
      }).catch(() => undefined);
    }

    return {
      success: true,
      message: 'Booking rescheduled successfully',
      data: updatedBooking
    };
  }

  private generateUpdateMessage(type: RealTimeUpdate['type'], booking: any): string {
    switch (type) {
      case 'booking_created':
        return `New booking: ${booking.guestName} - ${booking.propertyName}`;
      case 'booking_cancelled':
        return `Booking cancelled: ${booking.guestName} - ${booking.propertyName}`;
      case 'booking_modified':
        return `Booking updated: ${booking.guestName} - ${booking.propertyName}`;
      default:
        return `Booking activity: ${booking.guestName}`;
    }
  }
}
