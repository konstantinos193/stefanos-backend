import 'dotenv/config';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prismaOptions = {
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: ['error', 'warn'] as ('error' | 'warn')[],
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
