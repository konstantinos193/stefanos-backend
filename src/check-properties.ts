import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the check script');
}

// Configure Prisma client for Turso/libsql
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: ['error', 'warn'],
});

async function checkProperties() {
  console.log('🔍 Checking existing properties...');

  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        titleEn: true,
        titleGr: true,
        images: true
      }
    });

    if (properties.length === 0) {
      console.log('❌ No properties found in database');
      console.log('💡 You need to run the full seed first: pnpm run db:seed');
      return;
    }

    console.log(`✅ Found ${properties.length} properties:`);
    properties.forEach((property, index) => {
      console.log(`   ${index + 1}. ${property.titleEn} (${property.titleGr})`);
      console.log(`      Images: ${Array.isArray(property.images) ? (property.images as string[]).join(', ') : property.images}`);
    });

  } catch (error: any) {
    console.error('❌ Error checking properties:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkProperties()
  .then(() => {
    console.log('🎉 Property check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Property check failed:', error);
    process.exit(1);
  });
