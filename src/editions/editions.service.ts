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

  async getCategoriesWithCounts() {
    const categories = await this.prisma.edition.groupBy({
      by: ['category'],
      where: {
        status: 'PUBLISHED',
      },
      _count: {
        id: true,
      },
    });

    const result = await Promise.all(
      categories.map(async (cat) => {
        // Get the first edition in each category (ordered by order field) to use as category metadata
        const firstEdition = await this.prisma.edition.findFirst({
          where: {
            category: cat.category,
            status: 'PUBLISHED',
          },
          orderBy: {
            order: 'asc',
          },
          select: {
            titleGr: true,
            titleEn: true,
            descriptionGr: true,
            descriptionEn: true,
            icon: true,
            color: true,
          },
        });

        // Use first edition's metadata, or fallback to category name
        const titleGr = firstEdition?.titleGr || cat.category;
        const titleEn = firstEdition?.titleEn || cat.category;
        const descriptionGr = firstEdition?.descriptionGr || `${cat._count.id} εκδόσεις`;
        const descriptionEn = firstEdition?.descriptionEn || `${cat._count.id} editions`;
        const icon = firstEdition?.icon || `https://placehold.co/80x80/6b7280/FFFFFF?text=${cat.category}`;
        const color = (firstEdition?.color || 'gray') as 'blue' | 'green' | 'purple' | 'orange' | 'gray';

        return {
          id: cat.category,
          title: {
            gr: titleGr,
            en: titleEn,
          },
          description: {
            gr: descriptionGr,
            en: descriptionEn,
          },
          count: cat._count.id,
          icon: icon,
          color: color,
        };
      })
    );

    return {
      success: true,
      data: result,
    };
  }
}

