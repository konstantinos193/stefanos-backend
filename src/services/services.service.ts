import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { isActive?: string }) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', isActive } = query;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = 'desc';
    }

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        services,
        pagination,
      },
    };
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      success: true,
      data: service,
    };
  }

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.service.create({
      data: createServiceDto,
    });

    return {
      success: true,
      message: 'Service created successfully',
      data: service,
    };
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Service not found');
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });

    return {
      success: true,
      message: 'Service updated successfully',
      data: service,
    };
  }

  async remove(id: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }

  async toggle(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const updatedService = await this.prisma.service.update({
      where: { id },
      data: {
        isActive: !service.isActive,
      },
    });

    return {
      success: true,
      message: `Service ${updatedService.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedService,
    };
  }
}

