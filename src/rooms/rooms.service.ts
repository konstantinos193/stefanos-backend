import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto, userId: string) {
    // Verify property exists and belongs to user
    const property = await this.prisma.property.findUnique({
      where: { id: createRoomDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== userId) {
      throw new ForbiddenException('You can only add rooms to your own properties');
    }

    // Create room
    const room = await this.prisma.room.create({
      data: {
        ...createRoomDto,
        ownerId: userId,
        amenities: createRoomDto.amenities || [],
        images: createRoomDto.images || [],
      },
    });

    // Update property to indicate it has dynamic rooms
    await this.prisma.property.update({
      where: { id: createRoomDto.propertyId },
      data: { hasDynamicRooms: true },
    });

    return room;
  }

  async findAll(propertyId: string, userId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Only property owner can see all rooms (including non-bookable)
    const where: any = { propertyId };
    if (property.ownerId !== userId) {
      where.isBookable = true; // Guests only see bookable rooms
    }

    const rooms = await this.prisma.room.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: { rooms },
    };
  }

  async findAllBookable() {
    const rooms = await this.prisma.room.findMany({
      where: { isBookable: true },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
          },
        },
      },
      orderBy: [{ property: { titleGr: 'asc' } }, { name: 'asc' }],
    });

    return {
      success: true,
      data: { rooms },
    };
  }

  async findAllPublic() {
    // Return all bookable rooms with property info for public display
    return this.prisma.room.findMany({
      where: { isBookable: true },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
            images: true,
          },
        },
      },
      orderBy: { basePrice: 'asc' },
    });
  }

  async findAvailablePublic(checkIn: string, checkOut: string, guests?: number) {
    const { startDate, endDate } = this.parseSearchDates(checkIn, checkOut);

    const roomWhere: any = { isBookable: true };
    if (guests !== undefined) {
      if (!Number.isFinite(guests) || guests < 1) {
        throw new BadRequestException('Guests must be a positive number');
      }
      roomWhere.capacity = { gte: Math.floor(guests) };
    }

    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
            images: true,
          },
        },
      },
      orderBy: { basePrice: 'asc' },
    });

    const propertyIds = [...new Set(rooms.map((r) => r.propertyId))];

    const [availabilityRecords, conflictingBookings] = await Promise.all([
      this.prisma.propertyAvailability.findMany({
        where: {
          propertyId: { in: propertyIds },
          date: { gte: startDate, lte: endDate },
          available: true,
        },
        select: { propertyId: true },
      }),
      this.prisma.booking.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lte: endDate },
          checkOut: { gte: startDate },
        },
        select: { propertyId: true },
      }),
    ]);

    const availablePropertyIds = new Set(availabilityRecords.map((r) => r.propertyId));
    const bookedPropertyIds = new Set(conflictingBookings.map((b) => b.propertyId));

    return rooms.filter(
      (room) => availablePropertyIds.has(room.propertyId) && !bookedPropertyIds.has(room.propertyId),
    );
  }

  async findOnePublic(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id, isBookable: true },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
            images: true,
            amenities: {
              include: {
                amenity: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found or not available');
    }

    return room;
  }

  async findOne(id: string, userId?: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Verify access
    if (!room.isBookable && room.ownerId !== userId) {
      throw new ForbiddenException('Room is not available for booking');
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string, userRole?: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Admin users can update any room
    if (userRole !== 'ADMIN' && room.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own rooms');
    }

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  async remove(id: string, userId: string, userRole?: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Admin users can delete any room
    if (userRole !== 'ADMIN' && room.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own rooms');
    }

    await this.prisma.room.delete({
      where: { id },
    });

    // Check if property still has rooms
    const remainingRooms = await this.prisma.room.count({
      where: { propertyId: room.propertyId },
    });

    if (remainingRooms === 0) {
      await this.prisma.property.update({
        where: { id: room.propertyId },
        data: { hasDynamicRooms: false },
      });
    }

    return { message: 'Room deleted successfully' };
  }

  async getRoomAvailability(roomId: string, startDate: Date, endDate: Date) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { property: true },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return this.calculatePropertyAvailability(room.propertyId, startDate, endDate);
  }

  private parseSearchDates(checkIn: string, checkOut: string) {
    if (!checkIn || !checkOut) {
      throw new BadRequestException('checkIn and checkOut are required');
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid checkIn or checkOut date');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('checkOut must be after checkIn');
    }

    return { startDate, endDate };
  }

  async getOccupancyForRange(startDateStr: string, endDateStr: string) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }

    if (endDate < startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    // Fetch all bookable rooms in one query
    const rooms = await this.prisma.room.findMany({
      where: { isBookable: true },
      select: { id: true, propertyId: true },
    });

    const totalRooms = rooms.length;
    if (totalRooms === 0) {
      return { dates: {}, totalRooms: 0 };
    }

    // Get unique property IDs
    const propertyIds = [...new Set(rooms.map((r) => r.propertyId))];

    // Fetch all overlapping bookings for these properties in one query
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lte: endDate },
        checkOut: { gte: startDate },
      },
      select: { propertyId: true, checkIn: true, checkOut: true },
    });

    // Fetch availability records for these properties in one query
    const availabilityRecords = await this.prisma.propertyAvailability.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: startDate, lte: endDate },
        available: true,
      },
      select: { propertyId: true, date: true },
    });

    // Build a set of propertyId+date for availability
    const availabilitySet = new Set<string>();
    for (const rec of availabilityRecords) {
      const dateStr = new Date(rec.date).toISOString().split('T')[0];
      availabilitySet.add(`${rec.propertyId}:${dateStr}`);
    }

    // Build per-property booking ranges for quick lookup
    const propertyBookings = new Map<string, Array<{ checkIn: Date; checkOut: Date }>>();
    for (const b of bookings) {
      if (!propertyBookings.has(b.propertyId)) {
        propertyBookings.set(b.propertyId, []);
      }
      propertyBookings.get(b.propertyId)!.push({
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
      });
    }

    // Compute per-day occupancy
    const dates: Record<string, { available: number; total: number; occupancy: number }> = {};
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().split('T')[0];
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      let availableCount = 0;

      for (const room of rooms) {
        const hasAvailability = availabilitySet.has(`${room.propertyId}:${dayStr}`);
        const roomBookings = propertyBookings.get(room.propertyId) || [];
        const hasConflict = roomBookings.some(
          (b) => b.checkIn <= nextDay && b.checkOut >= currentDate,
        );

        if (hasAvailability && !hasConflict) {
          availableCount++;
        }
      }

      const occupancyRate = totalRooms > 0
        ? Math.round(((totalRooms - availableCount) / totalRooms) * 100)
        : 0;

      dates[dayStr] = {
        available: availableCount,
        total: totalRooms,
        occupancy: occupancyRate,
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { dates, totalRooms };
  }

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all rooms (not just bookable) for full management view
    const rooms = await this.prisma.room.findMany({
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            cleaningFee: true,
            lastCleaningDate: true,
          },
        },
      },
      orderBy: [{ isBookable: 'desc' }, { name: 'asc' }],
    });

    if (rooms.length === 0) {
      return {
        success: true,
        data: {
          stats: {
            totalRooms: 0,
            bookableRooms: 0,
            unavailableRooms: 0,
            averagePrice: 0,
            totalUpcomingBookings: 0,
            occupancyRate: 0,
            totalRevenue: 0,
          },
          rooms: [],
        },
      };
    }

    const propertyIds = [...new Set(rooms.map((r) => r.propertyId))];

    // Fetch upcoming bookings for all rooms (next 30 days)
    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
        checkOut: { gte: now },
        checkIn: { lte: thirtyDaysFromNow },
      },
      select: {
        id: true,
        propertyId: true,
        roomId: true,
        roomName: true,
        checkIn: true,
        checkOut: true,
        guestName: true,
        guests: true,
        totalPrice: true,
        status: true,
      },
      orderBy: { checkIn: 'asc' },
    });

    // Fetch all completed bookings for revenue
    const completedBookings = await this.prisma.booking.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      },
      select: {
        roomId: true,
        totalPrice: true,
      },
    });

    // Fetch cleaning schedules
    const cleaningSchedules = await this.prisma.cleaningSchedule.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      select: {
        propertyId: true,
        lastCleaned: true,
        nextCleaning: true,
        frequency: true,
      },
      orderBy: { lastCleaned: 'desc' },
    });

    // Build per-room data
    const bookingsByRoom = new Map<string, typeof upcomingBookings>();
    const bookingsByProperty = new Map<string, typeof upcomingBookings>();
    for (const booking of upcomingBookings) {
      const key = booking.roomId || booking.propertyId;
      if (booking.roomId) {
        if (!bookingsByRoom.has(booking.roomId)) bookingsByRoom.set(booking.roomId, []);
        bookingsByRoom.get(booking.roomId)!.push(booking);
      }
      if (!bookingsByProperty.has(booking.propertyId)) bookingsByProperty.set(booking.propertyId, []);
      bookingsByProperty.get(booking.propertyId)!.push(booking);
    }

    const revenueByRoom = new Map<string, number>();
    for (const b of completedBookings) {
      if (b.roomId) {
        revenueByRoom.set(b.roomId, (revenueByRoom.get(b.roomId) || 0) + b.totalPrice);
      }
    }

    const cleaningByProperty = new Map<string, (typeof cleaningSchedules)[0]>();
    for (const cs of cleaningSchedules) {
      if (!cleaningByProperty.has(cs.propertyId)) {
        cleaningByProperty.set(cs.propertyId, cs);
      }
    }

    // Check which rooms are currently occupied
    const activeBookings = upcomingBookings.filter(
      (b) =>
        (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') &&
        new Date(b.checkIn) <= now &&
        new Date(b.checkOut) >= now,
    );
    const occupiedRoomIds = new Set(activeBookings.map((b) => b.roomId).filter(Boolean));
    const occupiedPropertyIds = new Set(activeBookings.map((b) => b.propertyId));

    const bookableRooms = rooms.filter((r) => r.isBookable);
    const totalRevenue = Array.from(revenueByRoom.values()).reduce((sum, v) => sum + v, 0);
    const avgPrice = bookableRooms.length > 0
      ? bookableRooms.reduce((sum, r) => sum + r.basePrice, 0) / bookableRooms.length
      : 0;

    const occupiedCount = bookableRooms.filter(
      (r) => occupiedRoomIds.has(r.id) || occupiedPropertyIds.has(r.propertyId),
    ).length;
    const occupancyRate = bookableRooms.length > 0
      ? Math.round((occupiedCount / bookableRooms.length) * 100)
      : 0;

    const enrichedRooms = rooms.map((room) => {
      const roomBookings = bookingsByRoom.get(room.id) || bookingsByProperty.get(room.propertyId) || [];
      const cleaning = cleaningByProperty.get(room.propertyId);
      const isOccupied = occupiedRoomIds.has(room.id) || occupiedPropertyIds.has(room.propertyId);
      const nextBooking = roomBookings.find((b) => new Date(b.checkIn) > now);
      const revenue = revenueByRoom.get(room.id) || 0;

      return {
        ...room,
        upcomingBookingsCount: roomBookings.length,
        nextBooking: nextBooking
          ? {
              id: nextBooking.id,
              checkIn: nextBooking.checkIn,
              checkOut: nextBooking.checkOut,
              guestName: nextBooking.guestName,
              guests: nextBooking.guests,
            }
          : null,
        isOccupied,
        lastCleaned: cleaning?.lastCleaned || null,
        nextCleaning: cleaning?.nextCleaning || null,
        cleaningFrequency: cleaning?.frequency || null,
        totalRevenue: revenue,
      };
    });

    return {
      success: true,
      data: {
        stats: {
          totalRooms: rooms.length,
          bookableRooms: bookableRooms.length,
          unavailableRooms: rooms.length - bookableRooms.length,
          averagePrice: Math.round(avgPrice * 100) / 100,
          totalUpcomingBookings: upcomingBookings.length,
          occupancyRate,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
        },
        rooms: enrichedRooms,
      },
    };
  }

  private async calculatePropertyAvailability(propertyId: string, startDate: Date, endDate: Date) {
    const [availability, bookings] = await Promise.all([
      this.prisma.propertyAvailability.findMany({
        where: {
          propertyId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          available: true,
        },
      }),
      this.prisma.booking.findMany({
        where: {
          propertyId,
          status: {
            in: ['CONFIRMED', 'CHECKED_IN'],
          },
          OR: [
            {
              checkIn: { lte: endDate },
              checkOut: { gte: startDate },
            },
          ],
        },
      }),
    ]);

    return {
      available: availability.length > 0 && bookings.length === 0,
      availability,
      conflictingBookings: bookings.length,
    };
  }
}

