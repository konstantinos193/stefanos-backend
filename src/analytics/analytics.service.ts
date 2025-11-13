import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialUtil } from '../common/utils/financial.util';
import { AnalyticsPeriod } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getPropertyAnalytics(
    propertyId: string,
    period: AnalyticsPeriod,
    startDate: Date,
    endDate: Date,
    userId: string,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Verify access
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isOwner = property.ownerId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Unauthorized to view analytics');
    }

    // Get bookings in period
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        checkIn: { gte: startDate },
        checkOut: { lte: endDate },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      },
    });

    // Get reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // Calculate metrics
    const totalRevenue = bookings.reduce(
      (sum, booking) => sum + (booking.ownerRevenue || 0),
      0,
    );

    const totalCosts = bookings.reduce(
      (sum, booking) => sum + (booking.cleaningFee || 0),
      0,
    );

    const platformFees = bookings.reduce(
      (sum, booking) => sum + (booking.platformFee || 0),
      0,
    );

    const { netProfit, profitMargin } = FinancialUtil.calculateProfitMargin(
      totalRevenue,
      totalCosts,
    );

    // Calculate occupancy
    const totalNights = bookings.reduce(
      (sum, booking) =>
        sum +
        Math.ceil(
          (booking.checkOut.getTime() - booking.checkIn.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      0,
    );

    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const occupancyRate = FinancialUtil.calculateOccupancyRate(
      totalNights,
      daysInPeriod,
    );

    const averageDailyRate = FinancialUtil.calculateAverageDailyRate(
      totalRevenue,
      totalNights,
    );

    // Calculate average ratings
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    const averageCleanlinessRating =
      reviews.length > 0
        ? reviews.reduce(
            (sum, r) => sum + (r.cleanlinessRating || 0),
            0,
          ) / reviews.filter((r) => r.cleanlinessRating).length
        : null;

    // Create or update analytics record
    const analytics = await this.prisma.propertyAnalytics.upsert({
      where: {
        propertyId_period_periodStart: {
          propertyId,
          period,
          periodStart: startDate,
        },
      },
      create: {
        propertyId,
        period,
        periodStart: startDate,
        periodEnd: endDate,
        totalRevenue,
        totalCosts,
        cleaningCosts: totalCosts,
        maintenanceCosts: 0, // TODO: Calculate from maintenance requests
        platformFees,
        netProfit,
        profitMargin,
        totalBookings: bookings.length,
        cancelledBookings: 0, // TODO: Calculate cancelled bookings
        occupancyRate,
        averageDailyRate,
        averageRating: averageRating || 0,
        averageCleanlinessRating: averageCleanlinessRating || 0,
        totalReviews: reviews.length,
      },
      update: {
        totalRevenue,
        totalCosts,
        cleaningCosts: totalCosts,
        platformFees,
        netProfit,
        profitMargin,
        totalBookings: bookings.length,
        occupancyRate,
        averageDailyRate,
        averageRating: averageRating || 0,
        averageCleanlinessRating: averageCleanlinessRating || 0,
        totalReviews: reviews.length,
      },
    });

    return analytics;
  }

  async getFinancialAnalytics(userId: string, period: AnalyticsPeriod) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all properties owned by user
    const properties = await this.prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
          },
        },
        payments: {
          where: {
            status: 'COMPLETED',
          },
        },
      },
    });

    const totalRevenue = properties.reduce(
      (sum, prop) =>
        sum +
        prop.bookings.reduce(
          (bookingSum, booking) => bookingSum + (booking.ownerRevenue || 0),
          0,
        ),
      0,
    );

    const totalPlatformFees = properties.reduce(
      (sum, prop) =>
        sum +
        prop.bookings.reduce(
          (bookingSum, booking) => bookingSum + (booking.platformFee || 0),
          0,
        ),
      0,
    );

    const totalBookings = properties.reduce(
      (sum, prop) => sum + prop.bookings.length,
      0,
    );

    return {
      totalRevenue,
      totalPlatformFees,
      totalBookings,
      properties: properties.map((prop) => ({
        id: prop.id,
        title: prop.titleEn,
        revenue: prop.bookings.reduce(
          (sum, booking) => sum + (booking.ownerRevenue || 0),
          0,
        ),
        bookings: prop.bookings.length,
      })),
    };
  }
}

