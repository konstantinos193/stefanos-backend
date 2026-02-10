import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto, ContentQueryDto } from './dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async create(createContentDto: CreateContentDto) {
    const existing = await this.prisma.content.findFirst({
      where: {
        page: createContentDto.page,
        section: createContentDto.section,
        key: createContentDto.key,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Content with page '${createContentDto.page}', section '${createContentDto.section}', and key '${createContentDto.key}' already exists`
      );
    }

    return this.prisma.content.create({
      data: createContentDto,
    });
  }

  async findAll(query: ContentQueryDto) {
    const where: any = {};

    if (query.page) where.page = query.page;
    if (query.section) where.section = query.section;
    if (query.active !== undefined) where.active = query.active;
    if (query.type) where.type = query.type;

    const [data, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          media: {
            include: {
              media: true,
            },
          },
        },
        orderBy: { order: 'asc' },
        skip: query.skip || 0,
        take: query.take || 50,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        skip: query.skip || 0,
        take: query.take || 50,
      },
    };
  }

  async findByPage(page: string, activeOnly = true) {
    const where: any = { page };
    if (activeOnly) where.active = true;

    return this.prisma.content.findMany({
      where,
      include: {
        media: {
          include: {
            media: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ section: 'asc' }, { order: 'asc' }],
    });
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        media: {
          include: {
            media: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID '${id}' not found`);
    }

    return content;
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID '${id}' not found`);
    }

    return this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });
  }

  async remove(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID '${id}' not found`);
    }

    await this.prisma.content.delete({
      where: { id },
    });

    return { message: 'Content deleted successfully' };
  }

  async addMediaToContent(contentId: string, mediaId: string, order?: number) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException(`Content with ID '${contentId}' not found`);
    }

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID '${mediaId}' not found`);
    }

    return this.prisma.contentMedia.create({
      data: {
        contentId,
        mediaId,
        order: order ?? 0,
      },
    });
  }

  async removeMediaFromContent(contentId: string, mediaId: string) {
    return this.prisma.contentMedia.deleteMany({
      where: {
        contentId,
        mediaId,
      },
    });
  }
}
