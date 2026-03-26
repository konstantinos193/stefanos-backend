import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinancialUtil } from '../common/utils/financial.util';
import { AnalyticsPeriod } from '../database/types';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private resolveDates(
    period: string,
    startDateStr?: string,
    endDateStr?: string,
  ): { startDate: Date; endDate: Date } {
    if (startDateStr && endDateStr) {
      return { startDate: new Date(startDateStr), endDate: new Date(endDateStr) };
    }
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;
    switch (period) {
      case 'DAILY':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'WEEKLY':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 84);
        break;
      case 'YEARLY':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 5);
        break;
      default: // MONTHLY / QUARTERLY
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 12);
    }
    return { startDate, endDate };
  }

  private getBucketKey(date: Date, period: string): string {
    const d = new Date(date);
    if (period === 'DAILY') {
      return d.toISOString().split('T')[0];
    }
    if (period === 'WEEKLY') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      return monday.toISOString().split('T')[0];
    }
    if (period === 'MONTHLY') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    // YEARLY / QUARTERLY
    return `${d.getFullYear()}-01-01`;
  }

  private generateBuckets(startDate: Date, endDate: Date, period: string): string[] {
    const buckets: string[] = [];
    const seen = new Set<string>();
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = this.getBucketKey(current, period);
      if (!seen.has(key)) {
        seen.add(key);
        buckets.push(key);
      }
      if (period === 'DAILY') current.setDate(current.getDate() + 1);
      else if (period === 'WEEKLY') current.setDate(current.getDate() + 7);
      else if (period === 'MONTHLY') current.setMonth(current.getMonth() + 1);
      else current.setFullYear(current.getFullYear() + 1);
    }
    return buckets;
  }

  private pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  }

  // ─── Dashboard metrics ────────────────────────────────────────────────────────

  async getDashboardMetrics(
    userId: string,
    period: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const admin = await this.isAdmin(userId);
    const { startDate, endDate } = this.resolveDates(period, startDateStr, endDateStr);

    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const buildWhere = (start: Date, end: Date) => {
      const where: any = {
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
        checkIn: { gte: start, lte: end },
      };
      if (!admin) where.property = { ownerId: userId };
      return where;
    };

    const [currentBookings, prevBookings, activeUsers, prevUsers] = await Promise.all([
      this.prisma.booking.findMany({ where: buildWhere(startDate, endDate), select: { ownerRevenue: true } }),
      this.prisma.booking.findMany({ where: buildWhere(prevStart, prevEnd), select: { ownerRevenue: true } }),
      admin
        ? this.prisma.user.count({ where: { isActive: true, role: { not: 'ADMIN' as any } } })
        : Promise.resolve(0),
      admin
        ? this.prisma.user.count({ where: { isActive: true, role: { not: 'ADMIN' as any }, createdAt: { lt: startDate } } })
        : Promise.resolve(0),
    ]);

    const revenue = currentBookings.reduce((s, b) => s + (b.ownerRevenue || 0), 0);
    const prevRevenue = prevBookings.reduce((s, b) => s + (b.ownerRevenue || 0), 0);

    return {
      success: true,
      data: {
        pageViews: 0,
        activeUsers,
        revenue,
        bookings: currentBookings.length,
        pageViewsChange: 0,
        activeUsersChange: this.pctChange(activeUsers, prevUsers),
        revenueChange: this.pctChange(revenue, prevRevenue),
        bookingsChange: this.pctChange(currentBookings.length, prevBookings.length),
      },
    };
  }

  // ─── Revenue chart ────────────────────────────────────────────────────────────

  async getRevenueChart(
    userId: string,
    period: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const admin = await this.isAdmin(userId);
    const { startDate, endDate } = this.resolveDates(period, startDateStr, endDateStr);

    const where: any = {
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      checkIn: { gte: startDate, lte: endDate },
    };
    if (!admin) where.property = { ownerId: userId };

    const bookings = await this.prisma.booking.findMany({
      where,
      select: { checkIn: true, ownerRevenue: true, cleaningFee: true, serviceFee: true },
    });

    const buckets = this.generateBuckets(startDate, endDate, period);
    const map: Record<string, { revenue: number; costs: number }> = {};
    buckets.forEach((b) => { map[b] = { revenue: 0, costs: 0 }; });

    for (const booking of bookings) {
      const key = this.getBucketKey(booking.checkIn, period);
      if (map[key]) {
        map[key].revenue += booking.ownerRevenue || 0;
        map[key].costs += (booking.cleaningFee || 0) + (booking.serviceFee || 0);
      }
    }

    return {
      success: true,
      data: buckets.map((date) => ({
        date,
        revenue: map[date].revenue,
        costs: map[date].costs,
        profit: map[date].revenue - map[date].costs,
      })),
    };
  }

  // ─── Booking trends ───────────────────────────────────────────────────────────

  async getBookingTrends(
    userId: string,
    period: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const admin = await this.isAdmin(userId);
    const { startDate, endDate } = this.resolveDates(period, startDateStr, endDateStr);

    const where: any = { createdAt: { gte: startDate, lte: endDate } };
    if (!admin) where.property = { ownerId: userId };

    const bookings = await this.prisma.booking.findMany({
      where,
      select: { createdAt: true, status: true },
    });

    const buckets = this.generateBuckets(startDate, endDate, period);
    const map: Record<string, { bookings: number; cancelled: number }> = {};
    buckets.forEach((b) => { map[b] = { bookings: 0, cancelled: 0 }; });

    for (const booking of bookings) {
      const key = this.getBucketKey(booking.createdAt, period);
      if (map[key]) {
        map[key].bookings++;
        if (booking.status === 'CANCELLED') map[key].cancelled++;
      }
    }

    return {
      success: true,
      data: buckets.map((date) => ({
        date,
        bookings: map[date].bookings,
        cancelled: map[date].cancelled,
      })),
    };
  }

  // ─── User distribution ────────────────────────────────────────────────────────

  async getUserDistribution(userId: string) {
    const admin = await this.isAdmin(userId);
    if (!admin) return { success: true, data: [] };

    const [total, guests, owners, managers, admins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'USER' as any } }),
      this.prisma.user.count({ where: { role: 'PROPERTY_OWNER' as any } }),
      this.prisma.user.count({ where: { role: 'MANAGER' as any } }),
      this.prisma.user.count({ where: { role: 'ADMIN' as any } }),
    ]);

    const safe = total || 1;
    const categories = [
      { category: 'Guests', count: guests, percentage: Math.round((guests / safe) * 100) },
      { category: 'Property Owners', count: owners, percentage: Math.round((owners / safe) * 100) },
      { category: 'Managers', count: managers, percentage: Math.round((managers / safe) * 100) },
      { category: 'Admins', count: admins, percentage: Math.round((admins / safe) * 100) },
    ].filter((c) => c.count > 0);

    return { success: true, data: categories };
  }

  // ─── Activity data ────────────────────────────────────────────────────────────

  async getActivityData(
    userId: string,
    period: string,
    startDateStr?: string,
    endDateStr?: string,
  ) {
    const admin = await this.isAdmin(userId);
    const { startDate, endDate } = this.resolveDates(period, startDateStr, endDateStr);

    const bookingWhere: any = {
      createdAt: { gte: startDate, lte: endDate },
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
    };
    if (!admin) bookingWhere.property = { ownerId: userId };

    const [bookings, newUsers] = await Promise.all([
      this.prisma.booking.findMany({
        where: bookingWhere,
        select: { createdAt: true, ownerRevenue: true },
      }),
      admin
        ? this.prisma.user.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            select: { createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const buckets = this.generateBuckets(startDate, endDate, period);
    const map: Record<string, { bookings: number; users: number; revenue: number }> = {};
    buckets.forEach((b) => { map[b] = { bookings: 0, users: 0, revenue: 0 }; });

    for (const booking of bookings) {
      const key = this.getBucketKey(booking.createdAt, period);
      if (map[key]) {
        map[key].bookings++;
        map[key].revenue += booking.ownerRevenue || 0;
      }
    }

    for (const u of newUsers) {
      const key = this.getBucketKey(u.createdAt, period);
      if (map[key]) map[key].users++;
    }

    return {
      success: true,
      data: buckets.map((date) => ({
        time: date,
        bookings: map[date].bookings,
        users: map[date].users,
        revenue: map[date].revenue,
      })),
    };
  }

  // ─── Property analytics (existing) ───────────────────────────────────────────

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

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isOwner = property.ownerId === userId;
    const isAdminUser = user?.role === 'ADMIN';

    if (!isOwner && !isAdminUser) {
      throw new ForbiddenException('Unauthorized to view analytics');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        checkIn: { gte: startDate },
        checkOut: { lte: endDate },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      },
    });

    const reviews = await this.prisma.review.findMany({
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.ownerRevenue || 0), 0);
    const totalCosts = bookings.reduce((sum, b) => sum + (b.cleaningFee || 0), 0);
    const platformFees = bookings.reduce((sum, b) => sum + (b.platformFee || 0), 0);

    const { netProfit, profitMargin } = FinancialUtil.calculateProfitMargin(totalRevenue, totalCosts);

    const totalNights = bookings.reduce(
      (sum, b) =>
        sum + Math.ceil((b.checkOut.getTime() - b.checkIn.getTime()) / (1000 * 60 * 60 * 24)),
      0,
    );

    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const occupancyRate = FinancialUtil.calculateOccupancyRate(totalNights, daysInPeriod);
    const averageDailyRate = FinancialUtil.calculateAverageDailyRate(totalRevenue, totalNights);

    const averageRating =
      reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    const cleanlinessReviews = reviews.filter((r) => r.cleanlinessRating);
    const averageCleanlinessRating =
      cleanlinessReviews.length > 0
        ? cleanlinessReviews.reduce((s, r) => s + (r.cleanlinessRating || 0), 0) /
          cleanlinessReviews.length
        : null;

    const analytics = await this.prisma.propertyAnalytics.upsert({
      where: {
        propertyId_period_periodStart: { propertyId, period, periodStart: startDate },
      },
      create: {
        propertyId, period, periodStart: startDate, periodEnd: endDate,
        totalRevenue, totalCosts, cleaningCosts: totalCosts, maintenanceCosts: 0,
        platformFees, netProfit, profitMargin,
        totalBookings: bookings.length, cancelledBookings: 0,
        occupancyRate, averageDailyRate,
        averageRating: averageRating || 0,
        averageCleanlinessRating: averageCleanlinessRating || 0,
        totalReviews: reviews.length,
      },
      update: {
        totalRevenue, totalCosts, cleaningCosts: totalCosts,
        platformFees, netProfit, profitMargin,
        totalBookings: bookings.length, occupancyRate, averageDailyRate,
        averageRating: averageRating || 0,
        averageCleanlinessRating: averageCleanlinessRating || 0,
        totalReviews: reviews.length,
      },
    });

    return analytics;
  }

  // ─── Financial analytics (existing) ──────────────────────────────────────────

  async getFinancialAnalytics(userId: string, period: AnalyticsPeriod) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const properties = await this.prisma.property.findMany({
      where: { ownerId: userId },
      include: {
        bookings: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] } },
        },
        payments: { where: { status: 'COMPLETED' } },
      },
    });

    const totalRevenue = properties.reduce(
      (sum, prop) =>
        sum + prop.bookings.reduce((s, b) => s + (b.ownerRevenue || 0), 0),
      0,
    );

    const totalPlatformFees = properties.reduce(
      (sum, prop) =>
        sum + prop.bookings.reduce((s, b) => s + (b.platformFee || 0), 0),
      0,
    );

    const totalBookings = properties.reduce((sum, prop) => sum + prop.bookings.length, 0);

    return {
      totalRevenue,
      totalPlatformFees,
      totalBookings,
      properties: properties.map((prop) => ({
        id: prop.id,
        title: prop.titleEn,
        revenue: prop.bookings.reduce((s, b) => s + (b.ownerRevenue || 0), 0),
        bookings: prop.bookings.length,
      })),
    };
  }
}
