import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../database/types';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportType {
  id: string;
  name: string;
  nameGr: string;
  description: string;
  descriptionGr: string;
  category: string;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  generatedDate: Date;
  size: string;
  status: 'Ready' | 'Generating' | 'Failed';
  filePath?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private readonly reportTypes: ReportType[] = [
    {
      id: 'revenue',
      name: 'Revenue Report',
      nameGr: 'Αναφορά Εσόδων',
      description: 'Monthly revenue analysis and breakdown',
      descriptionGr: 'Μηνιαία ανάλυση και ανάλυση εσόδων',
      category: 'Financial',
    },
    {
      id: 'bookings',
      name: 'Bookings Report',
      nameGr: 'Αναφορά Κρατήσεων',
      description: 'Comprehensive booking analysis and trends',
      descriptionGr: 'Ολοκληρωμένη ανάλυση και τάσεις κρατήσεων',
      category: 'Operations',
    },
    {
      id: 'properties',
      name: 'Properties Performance',
      nameGr: 'Απόδοση Ακινήτων',
      description: 'Property performance metrics and analytics',
      descriptionGr: 'Μετρήσεις απόδοσης και αναλυτικά στοιχεία ακινήτων',
      category: 'Performance',
    },
    {
      id: 'users',
      name: 'User Activity',
      nameGr: 'Δραστηριότητα Χρηστών',
      description: 'User activity and engagement report',
      descriptionGr: 'Αναφορά δραστηριότητας και αλληλεπίδρασης χρηστών',
      category: 'Users',
    },
    {
      id: 'maintenance',
      name: 'Maintenance Report',
      nameGr: 'Αναφορά Συντήρησης',
      description: 'Maintenance requests and resolution tracking',
      descriptionGr: 'Παρακολούθηση αιτημάτων συντήρησης και επίλυσης',
      category: 'Operations',
    },
  ];

  async getReports(userId: string): Promise<Report[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For now, return mock reports based on user role
    // In a real implementation, these would be stored in the database
    const reports: Report[] = [
      {
        id: '1',
        name: 'Μηνιαία Αναφορά Εσόδων',
        type: 'revenue',
        generatedDate: new Date('2024-11-01'),
        size: '2.4 MB',
        status: 'Ready',
        userId,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-01'),
      },
      {
        id: '2',
        name: 'Αναφορά Δραστηριότητας Χρηστών',
        type: 'users',
        generatedDate: new Date('2024-11-05'),
        size: '1.8 MB',
        status: 'Ready',
        userId,
        createdAt: new Date('2024-11-05'),
        updatedAt: new Date('2024-11-05'),
      },
      {
        id: '3',
        name: 'Αναφορά Απόδοσης Ακινήτων',
        type: 'properties',
        generatedDate: new Date('2024-11-10'),
        size: '3.2 MB',
        status: 'Ready',
        userId,
        createdAt: new Date('2024-11-10'),
        updatedAt: new Date('2024-11-10'),
      },
      {
        id: '4',
        name: 'Αναφορά Ανάλυσης Κρατήσεων',
        type: 'bookings',
        generatedDate: new Date('2024-11-12'),
        size: '2.1 MB',
        status: 'Generating',
        userId,
        createdAt: new Date('2024-11-12'),
        updatedAt: new Date('2024-11-12'),
      },
    ];

    return reports;
  }

  async generateReport(
    type: string,
    period: string,
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<{ message: string; reportId: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reportType = this.reportTypes.find(rt => rt.id === type);
    if (!reportType) {
      throw new BadRequestException('Invalid report type');
    }

    const reportId = `report_${Date.now()}_${type}`;
    
    // Generate report based on type
    switch (type) {
      case 'revenue':
        await this.generateRevenueReport(reportId, startDate, endDate, userId);
        break;
      case 'bookings':
        await this.generateBookingsReport(reportId, startDate, endDate, userId);
        break;
      case 'properties':
        await this.generatePropertiesReport(reportId, startDate, endDate, userId);
        break;
      case 'users':
        await this.generateUsersReport(reportId, startDate, endDate, userId);
        break;
      case 'maintenance':
        await this.generateMaintenanceReport(reportId, startDate, endDate, userId);
        break;
      default:
        throw new BadRequestException('Unsupported report type');
    }

    return {
      message: 'Report generation started',
      reportId,
    };
  }

  async downloadReport(reportId: string, userId: string): Promise<{ filePath: string; fileName: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In a real implementation, check if user has access to this report
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.pdf`);
    const fileName = `report_${reportId}.pdf`;

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Report file not found');
    }

    return { filePath, fileName };
  }

  async getReportTypes(): Promise<ReportType[]> {
    return this.reportTypes;
  }

  private async generateRevenueReport(reportId: string, startDate: Date, endDate: Date, userId: string) {
    // Get revenue data
    const bookings = await this.prisma.booking.findMany({
      where: {
        checkIn: { gte: startDate },
        checkOut: { lte: endDate },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      },
      include: {
        property: {
          select: {
            titleEn: true,
            titleGr: true,
          },
        },
      },
    });

    // Generate CSV content
    const csvContent = this.generateRevenueCSV(bookings);
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.csv`);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  private async generateBookingsReport(reportId: string, startDate: Date, endDate: Date, userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        checkIn: { gte: startDate },
        checkOut: { lte: endDate },
      },
      include: {
        property: {
          select: {
            titleEn: true,
            titleGr: true,
          },
        },
        guest: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const csvContent = this.generateBookingsCSV(bookings);
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.csv`);
    
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  private async generatePropertiesReport(reportId: string, startDate: Date, endDate: Date, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const properties = await this.prisma.property.findMany({
      where: user.role === 'ADMIN' ? {} : { ownerId: userId },
      include: {
        bookings: {
          where: {
            checkIn: { gte: startDate },
            checkOut: { lte: endDate },
            status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
          },
        },
        reviews: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const csvContent = this.generatePropertiesCSV(properties);
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.csv`);
    
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  private async generateUsersReport(reportId: string, startDate: Date, endDate: Date, userId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        bookings: {
          where: {
            checkIn: { gte: startDate },
            checkOut: { lte: endDate },
          },
        },
        reviews: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const csvContent = this.generateUsersCSV(users);
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.csv`);
    
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  private async generateMaintenanceReport(reportId: string, startDate: Date, endDate: Date, userId: string) {
    const maintenance = await this.prisma.maintenanceRequest.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        property: {
          select: {
            titleEn: true,
            titleGr: true,
          },
        },
      },
    });

    const csvContent = this.generateMaintenanceCSV(maintenance);
    const filePath = path.join(process.cwd(), 'reports', `${reportId}.csv`);
    
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, csvContent);
  }

  private generateRevenueCSV(bookings: any[]): string {
    const headers = ['Property', 'Guest Name', 'Check In', 'Check Out', 'Total Price', 'Owner Revenue', 'Platform Fee', 'Status'];
    const rows = bookings.map(booking => [
      booking.property.titleEn,
      booking.guestName,
      booking.checkIn.toISOString().split('T')[0],
      booking.checkOut.toISOString().split('T')[0],
      booking.totalPrice.toString(),
      booking.ownerRevenue?.toString() || '0',
      booking.platformFee?.toString() || '0',
      booking.status,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateBookingsCSV(bookings: any[]): string {
    const headers = ['Property', 'Guest Name', 'Guest Email', 'Check In', 'Check Out', 'Total Price', 'Status', 'Source'];
    const rows = bookings.map(booking => [
      booking.property.titleEn,
      booking.guestName,
      booking.guest.email,
      booking.checkIn.toISOString().split('T')[0],
      booking.checkOut.toISOString().split('T')[0],
      booking.totalPrice.toString(),
      booking.status,
      booking.source,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generatePropertiesCSV(properties: any[]): string {
    const headers = ['Property', 'Type', 'City', 'Base Price', 'Total Bookings', 'Total Revenue', 'Average Rating', 'Total Reviews'];
    const rows = properties.map(property => [
      property.titleEn,
      property.type,
      property.city,
      property.basePrice.toString(),
      property.bookings.length.toString(),
      property.bookings.reduce((sum, b) => sum + (b.ownerRevenue || 0), 0).toString(),
      property.reviews.length > 0 ? (property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length).toFixed(2) : '0',
      property.reviews.length.toString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateUsersCSV(users: any[]): string {
    const headers = ['Name', 'Email', 'Role', 'Registration Date', 'Total Bookings', 'Total Reviews'];
    const rows = users.map(user => [
      user.name || '',
      user.email,
      user.role,
      user.createdAt.toISOString().split('T')[0],
      user.bookings.length.toString(),
      user.reviews.length.toString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateMaintenanceCSV(maintenance: any[]): string {
    const headers = ['Property', 'Title', 'Priority', 'Status', 'Created Date', 'Completed Date'];
    const rows = maintenance.map(request => [
      request.property.titleEn,
      request.title,
      request.priority,
      request.status,
      request.createdAt.toISOString().split('T')[0],
      request.completedAt ? request.completedAt.toISOString().split('T')[0] : '',
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
