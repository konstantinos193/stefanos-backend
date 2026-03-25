/**
 * Update all rooms:
 * 1. Set type = APARTMENT for all rooms
 * 2. Add 'Sea View' to amenities for all rooms (if not already present)
 *
 * Usage: npx tsx scripts/update-rooms-apartment-seaview.ts
 */
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
});

async function main() {
  const rooms = await prisma.room.findMany({
    select: { id: true, name: true, type: true, amenities: true },
  });

  console.log(`Found ${rooms.length} rooms. Updating...`);

  let updated = 0;
  for (const room of rooms) {
    const currentAmenities: string[] = Array.isArray(room.amenities) ? (room.amenities as string[]) : [];
    const hasSeaView = currentAmenities.includes('Sea View');
    const newAmenities = hasSeaView ? currentAmenities : ['Sea View', ...currentAmenities];

    await prisma.room.update({
      where: { id: room.id },
      data: {
        type: 'APARTMENT',
        amenities: newAmenities,
      },
    });

    console.log(`  ✓ ${room.name} — type: ${room.type} → APARTMENT, Sea View: ${hasSeaView ? 'already present' : 'added'}`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} rooms.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
