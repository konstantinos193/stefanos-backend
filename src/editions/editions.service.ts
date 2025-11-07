import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEditionDto } from './dto/create-edition.dto';
import { UpdateEditionDto } from './dto/update-edition.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';

@Injectable()
export class EditionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { category?: string; status?: string }) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', category, status } = query;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.order = 'asc';
    }

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [editions, total] = await Promise.all([
      this.prisma.edition.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.edition.count({ where }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        editions,
        pagination,
      },
    };
  }

  async findOne(id: string) {
    const edition = await this.prisma.edition.findUnique({
      where: { id },
    });

    if (!edition) {
      throw new NotFoundException('Edition not found');
    }

    return {
      success: true,
      data: edition,
    };
  }

  async create(createEditionDto: CreateEditionDto) {
    const edition = await this.prisma.edition.create({
      data: createEditionDto,
    });

    return {
      success: true,
      message: 'Edition created successfully',
      data: edition,
    };
  }

  async update(id: string, updateEditionDto: UpdateEditionDto) {
    const existingEdition = await this.prisma.edition.findUnique({
      where: { id },
    });

    if (!existingEdition) {
      throw new NotFoundException('Edition not found');
    }

    const edition = await this.prisma.edition.update({
      where: { id },
      data: updateEditionDto,
    });

    return {
      success: true,
      message: 'Edition updated successfully',
      data: edition,
    };
  }

  async remove(id: string) {
    const existingEdition = await this.prisma.edition.findUnique({
      where: { id },
    });

    if (!existingEdition) {
      throw new NotFoundException('Edition not found');
    }

    await this.prisma.edition.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Edition deleted successfully',
    };
  }

  async findByCategory(category: string, query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [editions, total] = await Promise.all([
      this.prisma.edition.findMany({
        where: {
          category,
          status: 'PUBLISHED',
        },
        orderBy: {
          order: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.edition.count({
        where: {
          category,
          status: 'PUBLISHED',
        },
      }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        editions,
        pagination,
      },
    };
  }
}

