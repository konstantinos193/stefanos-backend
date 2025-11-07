import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKnowledgeArticleDto } from './dto/create-knowledge-article.dto';
import { UpdateKnowledgeArticleDto } from './dto/update-knowledge-article.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { getPagination } from '../common/utils/pagination.util';

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto & { category?: string; tags?: string; published?: string }) {
    const { page = 1, limit = 10, sortBy, sortOrder = 'desc', category, tags, published } = query;
    const skip = (page - 1) * limit;

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.publishedAt = 'desc';
    }

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (tags) {
      const tagList = tags.split(',');
      where.tags = {
        hasSome: tagList,
      };
    }
    if (published === 'true') {
      where.publishedAt = {
        not: null,
      };
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.knowledgeArticle.count({ where }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        articles,
        pagination,
      },
    };
  }

  async findOne(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found');
    }

    return {
      success: true,
      data: article,
    };
  }

  async create(createKnowledgeArticleDto: CreateKnowledgeArticleDto) {
    const article = await this.prisma.knowledgeArticle.create({
      data: {
        ...createKnowledgeArticleDto,
        publishedAt: createKnowledgeArticleDto.publishedAt ? new Date(createKnowledgeArticleDto.publishedAt) : null,
      },
    });

    return {
      success: true,
      message: 'Knowledge article created successfully',
      data: article,
    };
  }

  async update(id: string, updateKnowledgeArticleDto: UpdateKnowledgeArticleDto) {
    const existingArticle = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new NotFoundException('Knowledge article not found');
    }

    const article = await this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        ...updateKnowledgeArticleDto,
        publishedAt: updateKnowledgeArticleDto.publishedAt
          ? new Date(updateKnowledgeArticleDto.publishedAt)
          : existingArticle.publishedAt,
      },
    });

    return {
      success: true,
      message: 'Knowledge article updated successfully',
      data: article,
    };
  }

  async remove(id: string) {
    const existingArticle = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new NotFoundException('Knowledge article not found');
    }

    await this.prisma.knowledgeArticle.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Knowledge article deleted successfully',
    };
  }

  async publish(id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Knowledge article not found');
    }

    const updatedArticle = await this.prisma.knowledgeArticle.update({
      where: { id },
      data: {
        publishedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Article published successfully',
      data: updatedArticle,
    };
  }

  async findByCategory(category: string, query: PaginationDto) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where: {
          category,
          publishedAt: {
            not: null,
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.knowledgeArticle.count({
        where: {
          category,
          publishedAt: {
            not: null,
          },
        },
      }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        articles,
        pagination,
      },
    };
  }

  async search(query: string, paginationQuery: PaginationDto) {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeArticle.findMany({
        where: {
          OR: [
            { titleGr: { contains: query, mode: 'insensitive' } },
            { titleEn: { contains: query, mode: 'insensitive' } },
            { contentGr: { contains: query, mode: 'insensitive' } },
            { contentEn: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
          publishedAt: {
            not: null,
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.knowledgeArticle.count({
        where: {
          OR: [
            { titleGr: { contains: query, mode: 'insensitive' } },
            { titleEn: { contains: query, mode: 'insensitive' } },
            { contentGr: { contains: query, mode: 'insensitive' } },
            { contentEn: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
          ],
          publishedAt: {
            not: null,
          },
        },
      }),
    ]);

    const pagination = getPagination(page, limit, total);

    return {
      success: true,
      data: {
        articles,
        pagination,
      },
    };
  }
}

