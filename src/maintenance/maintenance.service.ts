import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceRequestDto } from './dto/create-maintenance-request.dto';
import { UpdateMaintenanceRequestDto } from './dto/update-maintenance-request.dto';
import { MaintenancePriority, MaintenanceStatus } from '../../prisma/generated/prisma';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    priority?: string;
    propertyId?: string;
    userId?: string;
  }) {
    const { page, limit, status, priority, propertyId, userId } = params;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status as MaintenanceStatus;
    }

    if (priority) {
      where.priority = priority as MaintenancePriority;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    // If user is not admin, only show their properties' maintenance requests
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        where.property = {
          ownerId: userId,
        };
      }
    }

    const [requests, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              titleGr: true,
              titleEn: true,
              address: true,
              city: true,
            },
          },
          booking: {
            select: {
              id: true,
              guestName: true,
              checkIn: true,
              checkOut: true,
            },
          },
        },
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    return {
      success: true,
      data: {
        maintenance: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findOne(id: string, userId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
            ownerId: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Check if user has access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && request.property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to view this maintenance request');
    }

    return {
      success: true,
      data: request,
    };
  }

  async create(
    createMaintenanceRequestDto: CreateMaintenanceRequestDto,
    userId: string,
  ) {
    // Verify property ownership
    const property = await this.prisma.property.findUnique({
      where: { id: createMaintenanceRequestDto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to create maintenance request for this property');
    }

    // Verify booking if provided
    if (createMaintenanceRequestDto.bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: createMaintenanceRequestDto.bookingId },
      });

      if (!booking || booking.propertyId !== createMaintenanceRequestDto.propertyId) {
        throw new NotFoundException('Booking not found or does not belong to this property');
      }
    }

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        ...createMaintenanceRequestDto,
        status: MaintenanceStatus.OPEN,
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    return {
      success: true,
      data: request,
    };
  }

  async update(
    id: string,
    updateMaintenanceRequestDto: UpdateMaintenanceRequestDto,
    userId: string,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Check if user has access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && request.property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to update this maintenance request');
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: updateMaintenanceRequestDto,
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedRequest,
    };
  }

  async assign(id: string, assignedTo: string, userId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Check if user has access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && request.property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to assign this maintenance request');
    }

    // Verify assigned user exists
    const assignedUser = await this.prisma.user.findUnique({
      where: { id: assignedTo },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found');
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        assignedTo,
        status: MaintenanceStatus.IN_PROGRESS,
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedRequest,
    };
  }

  async complete(id: string, userId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Check if user has access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN' && request.property.ownerId !== userId) {
      throw new ForbiddenException('Unauthorized to complete this maintenance request');
    }

    const updatedRequest = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            address: true,
            city: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedRequest,
    };
  }
}
