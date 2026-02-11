import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { getPagination } from '../common/utils/pagination.util';
import { FinancialUtil } from '../common/utils/financial.util';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: BookingQueryDto) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', search, status, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom || dateTo) {
      where.checkIn = {};
      if (dateFrom) {
        where.checkIn.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.checkIn.lte = new Date(dateTo);
      }
    }

    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { guestName: { contains: searchTerm, mode: 'insensitive' } },
        { guestEmail: { contains: searchTerm, mode: 'insensitive' } },
        { guestPhone: { contains: searchTerm, mode: 'insensitive' } },
        { id: { contains: searchTerm, mode: 'insensitive' } },
        {
          guest: {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
        {
          property: {
            OR: [
              { titleGr: { contains: searchTerm, mode: 'insensitive' } },
              { titleEn: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              titleGr: true,
              titleEn: true,
              images: true,
              address: true,
              city: true,
            },
          },
          guest: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        bookings,
        pagination,
      },
    };
  }

  async exportAll() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            images: true,
            address: true,
            city: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        guest: true,
        reviews: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      success: true,
      data: booking,
    };
  }

  async createPublic(createBookingDto: CreateBookingDto) {
    // Create or find guest user
    let guest = await this.prisma.user.findFirst({
      where: { email: createBookingDto.guestEmail }
    });

    if (!guest) {
      guest = await this.prisma.user.create({
        data: {
          email: createBookingDto.guestEmail,
          name: createBookingDto.guestName,
          phone: createBookingDto.guestPhone,
          role: 'USER',
          isActive: true,
        }
      });
    }

    return this.create(createBookingDto, guest.id);
  }

  async create(createBookingDto: CreateBookingDto, guestId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: createBookingDto.propertyId },
      select: {
        id: true,
        status: true,
        basePrice: true,
        cleaningFee: true,
        serviceFeePercentage: true,
        taxRate: true,
        currency: true,
        cancellationPolicy: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.status !== 'ACTIVE') {
      throw new BadRequestException('Property is not available for booking');
    }

    const checkIn = new Date(createBookingDto.checkIn);
    const checkOut = new Date(createBookingDto.checkOut);

    const conflictingBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: createBookingDto.propertyId,
        status: {
          in: ['CONFIRMED', 'CHECKED_IN'],
        },
        OR: [
          {
            checkIn: {
              lte: checkOut,
            },
            checkOut: {
              gte: checkIn,
            },
          },
        ],
      },
    });

    if (conflictingBookings.length > 0) {
      throw new BadRequestException('Property is not available for the selected dates');
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate price breakdown using FinancialUtil (stay-only payment model)
    const priceBreakdown = FinancialUtil.calculateTotalPrice(
      property.basePrice,
      nights,
      createBookingDto.guests,
      property.cleaningFee || 0,
      property.serviceFeePercentage || 10,
      property.taxRate || 24,
      0, // discounts
      property.currency || 'EUR',
    );

    // Calculate owner revenue (after platform fees)
    const { ownerRevenue, platformFee } = FinancialUtil.calculateOwnerRevenue(
      priceBreakdown.totalPrice,
      property.serviceFeePercentage || 10,
    );

    const booking = await this.prisma.booking.create({
      data: {
        propertyId: createBookingDto.propertyId,
        guestId,
        checkIn,
        checkOut,
        guests: createBookingDto.guests,
        totalPrice: priceBreakdown.totalPrice,
        basePrice: priceBreakdown.subtotal,
        cleaningFee: priceBreakdown.cleaningFee,
        serviceFee: priceBreakdown.serviceFee,
        taxes: priceBreakdown.taxes,
        currency: priceBreakdown.currency,
        ownerRevenue,
        platformFee,
        source: 'DIRECT',
        guestName: createBookingDto.guestName,
        guestEmail: createBookingDto.guestEmail,
        guestPhone: createBookingDto.guestPhone,
        specialRequests: createBookingDto.specialRequests,
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            images: true,
            address: true,
            city: true,
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

    return {
      success: true,
      message: 'Booking created successfully',
      data: booking,
    };
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    const existingBooking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    const booking = await this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            images: true,
            address: true,
            city: true,
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

    return {
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    };
  }

  async cancel(id: string, cancelBookingDto: CancelBookingDto, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify user has permission
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isGuest = booking.guestId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = user?.role === 'ADMIN';

    if (!isGuest && !isOwner && !isAdmin) {
      throw new BadRequestException('Unauthorized to cancel this booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    // Calculate refund based on cancellation policy
    const refundCalculation = FinancialUtil.calculateRefund(
      booking.totalPrice,
      new Date(),
      booking.checkIn,
      booking.property.cancellationPolicy,
    );

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        ...updatedBooking,
        refundCalculation,
      },
    };
  }
}

