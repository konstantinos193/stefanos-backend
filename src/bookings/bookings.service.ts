import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';
import { calculateTotalPrice } from '../common/utils/price.util';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
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
      this.prisma.booking.count(),
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

  async create(createBookingDto: CreateBookingDto, guestId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: createBookingDto.propertyId },
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
    const totalPrice = calculateTotalPrice(
      property.basePrice,
      property.cleaningFee || 0,
      property.serviceFee || 0,
      property.taxes || 0,
      nights,
    );

    const booking = await this.prisma.booking.create({
      data: {
        propertyId: createBookingDto.propertyId,
        guestId,
        checkIn,
        checkOut,
        guests: createBookingDto.guests,
        totalPrice,
        basePrice: property.basePrice * nights,
        cleaningFee: property.cleaningFee || 0,
        serviceFee: property.serviceFee || 0,
        taxes: property.taxes || 0,
        guestName: createBookingDto.guestName,
        guestEmail: createBookingDto.guestEmail,
        guestPhone: createBookingDto.guestPhone,
        specialRequests: createBookingDto.specialRequests,
        paymentMethod: createBookingDto.paymentMethod,
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

  async cancel(id: string, cancelBookingDto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        refundReason: cancelBookingDto.reason,
      },
    });

    return {
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking,
    };
  }
}

