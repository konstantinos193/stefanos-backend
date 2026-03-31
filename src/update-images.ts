import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the update script');
}

// Configure Prisma client for Turso/libsql
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: ['error', 'warn'],
});

async function updatePropertyImages() {
  console.log('🖼️  Updating property images to use local logo...');

  try {
    // Find the L'Incanto Apartments property
    const property = await prisma.property.findFirst({
      where: {
        titleEn: "L'Incanto Apartments"
      }
    });

    if (!property) {
      console.log('❌ L\'Incanto Apartments property not found');
      return;
    }

    console.log(`✅ Found property: ${property.titleEn}`);

    // Update the property images
    const updatedProperty = await prisma.property.update({
      where: { id: property.id },
      data: {
        images: [
          '/incanto-logo.png',
          '/incanto-logo.png',
          '/incanto-logo.png'
        ]
      }
    });

    console.log(`✅ Updated property images for: ${updatedProperty.titleEn}`);
    console.log('   New images:', updatedProperty.images);

  } catch (error: any) {
    console.error('❌ Error updating property images:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updatePropertyImages()
  .then(() => {
    console.log('🎉 Image update completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Image update failed:', error);
    process.exit(1);
  });
