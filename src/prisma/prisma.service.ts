import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { connectWithRetry } from '../lib/connection-retry';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Verify DATABASE_URL is set and normalized
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.logger.error('❌ DATABASE_URL is not set in environment variables');
      this.logger.error('Please set DATABASE_URL in your .env file');
      return;
    }

    // Check if database name is in the connection string
    const hasDbName = /mongodb\+srv:\/\/[^/]+\/([^?]+)/.test(dbUrl);
    if (!hasDbName) {
      this.logger.warn('⚠️  Database name not found in connection string');
      this.logger.warn('The connection string will be normalized to include a database name');
    }

    try {
      await connectWithRetry(this, 5, 2000);
      this.logger.log('✅ Database connection established');
    } catch (error: any) {
      this.logger.error('❌ Failed to connect to database after retries');
      this.logger.error('Please check your DATABASE_URL and MongoDB Atlas configuration');
      // Don't throw - allow the app to start but operations will fail gracefully
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

