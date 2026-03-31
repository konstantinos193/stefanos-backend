/**
 * Seed seasonal pricing rules for the 9 bookable Incanto apartments.
 * Creates RoomAvailabilityRule records for June–September with per-month price overrides.
 * Safe to re-run: deletes existing seasonal rules for Incanto rooms before re-creating them.
 *
 * Pricing (per night):
 *   Apt 1,2,3,5,6,8 → June €90 | July €110 | August €130 | September €110
 *   Apt 4,7         → June €80 | July €90  | August €100 | September €90
 *   Apt 9           → June €80 | July €100 | August €120 | September €100
 *   Apt 10          → closed (isBookable: false, no rules needed)
 *
 * Usage: npx tsx scripts/seed-incanto-pricing.ts
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

// Seasonal pricing per apartment number
const PRICING: Record<number, { june: number; july: number; august: number; september: number }> = {
  1: { june: 90,  july: 110, august: 130, september: 110 },
  2: { june: 90,  july: 110, august: 130, september: 110 },
  3: { june: 90,  july: 110, august: 130, september: 110 },
  4: { june: 80,  july: 90,  august: 100, september: 90  },
  5: { june: 90,  july: 110, august: 130, september: 110 },
  6: { june: 90,  july: 110, august: 130, september: 110 },
  7: { june: 80,  july: 90,  august: 100, september: 90  },
  8: { june: 90,  july: 110, august: 130, september: 110 },
  9: { june: 80,  july: 100, august: 120, september: 100 },
  // Apt 10: closed all summer — isBookable: false, skip pricing rules
};

// Build rules for a given year
function buildRules(year: number, prices: { june: number; july: number; august: number; september: number }) {
  return [
    {
      startDate: new Date(`${year}-06-01T00:00:00.000Z`),
      endDate:   new Date(`${year}-07-01T00:00:00.000Z`),
      priceOverride: prices.june,
      isAvailable: true,
    },
    {
      startDate: new Date(`${year}-07-01T00:00:00.000Z`),
      endDate:   new Date(`${year}-08-01T00:00:00.000Z`),
      priceOverride: prices.july,
      isAvailable: true,
    },
    {
      startDate: new Date(`${year}-08-01T00:00:00.000Z`),
      endDate:   new Date(`${year}-09-01T00:00:00.000Z`),
      priceOverride: prices.august,
      isAvailable: true,
    },
    {
      startDate: new Date(`${year}-09-01T00:00:00.000Z`),
      endDate:   new Date(`${year}-10-01T00:00:00.000Z`),
      priceOverride: prices.september,
      isAvailable: true,
    },
  ];
}

async function main() {
  // Find Incanto property
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });

  if (!incanto) {
    console.error('Incanto property not found. Run seed-incanto-rooms.ts first.');
    process.exit(1);
  }

  console.log(`Found Incanto: ${incanto.id}`);

  // Fetch the 9 bookable rooms ordered by roomNumber
  const rooms = await prisma.room.findMany({
    where: { propertyId: incanto.id, isBookable: true },
    orderBy: { name: 'asc' },
  });

  if (rooms.length === 0) {
    console.error('No bookable rooms found. Run seed-incanto-rooms.ts first.');
    process.exit(1);
  }

  console.log(`Found ${rooms.length} bookable rooms.`);

  // Delete existing seasonal rules (priceOverride is set) for these rooms
  const roomIds = rooms.map((r) => r.id);
  const deleted = await prisma.roomAvailabilityRule.deleteMany({
    where: {
      roomId: { in: roomIds },
      priceOverride: { not: null },
    },
  });
  console.log(`Deleted ${deleted.count} existing price override rules.`);

  // Determine apartment number from room name (e.g. "Apartment 01 – Ground Level" → 1)
  function getAptNumber(name: string): number | null {
    const m = name.match(/\b0?(\d{1,2})\b/);
    return m ? parseInt(m[1], 10) : null;
  }

  const YEARS = [2026, 2027];
  let totalCreated = 0;

  for (const room of rooms) {
    const aptNum = getAptNumber(room.name);
    if (aptNum === null || !PRICING[aptNum]) {
      console.warn(`  Skipping room "${room.name}" — could not map to apartment number.`);
      continue;
    }

    const prices = PRICING[aptNum];
    const rules = YEARS.flatMap((year) => buildRules(year, prices));

    await prisma.roomAvailabilityRule.createMany({
      data: rules.map((rule) => ({
        roomId: room.id,
        ...rule,
      })),
    });

    totalCreated += rules.length;
    console.log(`  Apt ${aptNum.toString().padStart(2, '0')} (${room.id.slice(0, 8)}…): June €${prices.june} / July €${prices.july} / Aug €${prices.august} / Sep €${prices.september} — ${rules.length} rules created (${YEARS.join(', ')})`);
  }

  console.log(`\nDone! Created ${totalCreated} pricing rules across ${rooms.length} rooms.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
