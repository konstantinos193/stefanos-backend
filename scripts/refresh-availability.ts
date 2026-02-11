/**
 * Refresh PropertyAvailability for Incanto Hotel only.
 * Does NOT touch users, bookings, rooms, or other properties.
 * Usage: npx tsx scripts/refresh-availability.ts
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
  // Find the Incanto property
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });

  if (!incanto) {
    console.error('Incanto property not found in database. You may need to run the full seed first.');
    process.exit(1);
  }

  console.log(`Found Incanto property: ${incanto.id} (${incanto.titleEn})`);

  // Check existing rooms
  const rooms = await prisma.room.findMany({
    where: { propertyId: incanto.id, isBookable: true },
  });
  console.log(`Found ${rooms.length} bookable rooms`);

  // Delete old availability for this property only
  const deleted = await prisma.propertyAvailability.deleteMany({
    where: { propertyId: incanto.id },
  });
  console.log(`Deleted ${deleted.count} old availability records`);

  // Create availability for the next 180 days (all available)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records: { propertyId: string; date: Date; available: boolean; price: number; minStay: number }[] = [];

  for (let i = 0; i < 180; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    records.push({
      propertyId: incanto.id,
      date,
      available: true,
      price: incanto.basePrice,
      minStay: incanto.minStay,
    });
  }

  await prisma.propertyAvailability.createMany({ data: records });
  console.log(`Created ${records.length} availability records (next 180 days, all available)`);
  console.log('Done! Rooms search should now return results.');
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
