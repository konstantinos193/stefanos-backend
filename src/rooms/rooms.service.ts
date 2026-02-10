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

    return this.prisma.room.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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

    const availabilityChecks = await Promise.all(
      rooms.map(async (room) => {
        const availability = await this.calculatePropertyAvailability(room.propertyId, startDate, endDate);
        return {
          room,
          available: availability.available,
        };
      }),
    );

    return availabilityChecks
      .filter((entry) => entry.available)
      .map((entry) => entry.room);
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

