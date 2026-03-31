import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { BookingsService } from '../bookings/bookings.service';
import { FinancialUtil } from '../common/utils/financial.util';

@ApiTags('Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('calculate')
  @Public()
  @ApiOperation({ summary: 'Calculate total price for a booking' })
  @ApiResponse({ status: 200 })
  async calculatePrice(
    @Query('propertyId') propertyId: string,
    @Query('roomId') roomId?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
    @Query('guests') guests?: number,
  ) {
    if (!propertyId || !checkIn || !checkOut || !guests) {
      throw new Error('propertyId, checkIn, checkOut, and guests are required');
    }

    // Use the same pricing logic as bookings service
    const property = await this.bookingsService['prisma'].property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        basePrice: true,
        cleaningFee: true,
        serviceFeePercentage: true,
        taxRate: true,
        currency: true,
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    let effectivePricePerNight = property.basePrice;

    // If roomId is provided, use room pricing
    if (roomId) {
      const room = await this.bookingsService['prisma'].room.findUnique({
        where: { id: roomId },
        include: {
          availabilityRules: {
            where: {
              startDate: { lte: checkOutDate },
              endDate: { gte: checkInDate },
              isAvailable: true,
            },
            orderBy: { startDate: 'asc' },
          },
        },
      });

      if (room) {
        let subtotal = 0;
        const current = new Date(checkInDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(checkOutDate);
        end.setHours(0, 0, 0, 0);

        while (current < end) {
          const rule = room.availabilityRules.find(
            (r) => new Date(r.startDate) <= current && new Date(r.endDate) > current,
          );
          subtotal += rule?.priceOverride ?? room.basePrice;
          current.setDate(current.getDate() + 1);
        }

        effectivePricePerNight = nights > 0 ? subtotal / nights : room.basePrice;
      }
    }

    // Calculate price breakdown using FinancialUtil (NO FEES)
    const priceBreakdown = FinancialUtil.calculateTotalPrice(
      effectivePricePerNight,
      nights,
      guests,
      0, // No cleaning fee
      0, // No service fee
      0, // No tax
      0, // discounts
      property.currency || 'EUR',
    );

    return {
      success: true,
      data: priceBreakdown,
    };
  }
}
