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

  async update(id: string, updateRoomDto: UpdateRoomDto, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own rooms');
    }

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  async remove(id: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.ownerId !== userId) {
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

