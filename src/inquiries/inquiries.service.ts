import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(private prisma: PrismaService) {}

  async create(createInquiryDto: CreateInquiryDto) {
    const { propertyId, ...inquiryData } = createInquiryDto;

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const inquiry = await this.prisma.inquiry.create({
      data: {
        ...inquiryData,
        propertyId,
      },
      include: {
        property: {
          include: {
            owner: true
          }
        }
      }
    });

    // TODO: Send email notification to property owner and admins
    // await this.notificationService.sendInquiryNotification(inquiry);

    return inquiry;
  }

  async findAll(status?: string, priority?: string, assignedTo?: string) {
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;

    return this.prisma.inquiry.findMany({
      where,
      include: {
        property: {
          include: {
            owner: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    return inquiry;
  }

  async update(id: string, updateInquiryDto: UpdateInquiryDto) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    const updateData: any = { ...updateInquiryDto };

    // If status is being changed to RESPONDED, set respondedAt and respondedBy
    if (updateInquiryDto.status === 'RESPONDED' && inquiry.status !== 'RESPONDED') {
      updateData.respondedAt = new Date();
      // Note: respondedBy should be set from the current user in the controller
    }

    return this.prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        property: {
          include: {
            owner: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async remove(id: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id }
    });

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    return this.prisma.inquiry.delete({
      where: { id }
    });
  }

  async getStats() {
    const stats = await this.prisma.inquiry.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    const priorityStats = await this.prisma.inquiry.groupBy({
      by: ['priority'],
      _count: {
        id: true
      }
    });

    const totalInquiries = await this.prisma.inquiry.count();
    const newInquiries = await this.prisma.inquiry.count({
      where: { status: 'NEW' }
    });

    return {
      total: totalInquiries,
      new: newInquiries,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.id;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}
