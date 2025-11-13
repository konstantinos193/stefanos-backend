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

    // Check property availability for the dates
    const availability = await this.prisma.propertyAvailability.findMany({
      where: {
        propertyId: room.propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        available: true,
      },
    });

    // Check for bookings that might block this room
    // Note: This is simplified - in production, you'd need room-specific booking tracking
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId: room.propertyId,
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
    });

    return {
      available: availability.length > 0 && bookings.length === 0,
      availability,
      conflictingBookings: bookings.length,
    };
  }
}

