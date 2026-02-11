/**
 * Seed only the 10 Incanto Hotel rooms into the existing property.
 * Does NOT touch users, bookings, other properties, or any other data.
 * Usage: npx tsx scripts/seed-incanto-rooms.ts
 */
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
});

type RoomTypeSeed = 'BEDROOM' | 'STUDIO';

interface RoomTemplate {
  roomNumber: number;
  nameEn: string;
  nameGr: string;
  descriptionEn: string;
  descriptionGr: string;
  type: RoomTypeSeed;
  capacity: number;
  basePrice: number;
  amenities: string[];
}

const ROOMS: RoomTemplate[] = [
  { roomNumber: 1, nameEn: 'Deluxe Room - Ground Floor No1', nameGr: 'Deluxe Room - Ground Floor No1', descriptionEn: 'Elegant comfort with Mediterranean views and modern amenities.', descriptionGr: 'Elegant comfort with Mediterranean views and modern amenities.', type: 'BEDROOM', capacity: 2, basePrice: 150, amenities: ['Sea View', 'King Bed', 'Mini Bar', 'Workspace', 'Free WiFi'] },
  { roomNumber: 2, nameEn: 'Garden Room - Ground Floor No2', nameGr: 'Garden Room - Ground Floor No2', descriptionEn: 'Cozy ground-floor room overlooking the garden.', descriptionGr: 'Cozy ground-floor room overlooking the garden.', type: 'BEDROOM', capacity: 2, basePrice: 120, amenities: ['Garden View', 'Queen Bed', 'Balcony', 'Coffee Station', 'Free WiFi'] },
  { roomNumber: 3, nameEn: 'Premium Room - First Floor No3', nameGr: 'Premium Room - First Floor No3', descriptionEn: 'Bright first-floor room with refined interiors and sea breeze.', descriptionGr: 'Bright first-floor room with refined interiors and sea breeze.', type: 'BEDROOM', capacity: 2, basePrice: 180, amenities: ['Sea View', 'King Bed', 'Smart TV', 'Coffee Machine', 'Free WiFi'] },
  { roomNumber: 4, nameEn: 'Superior Room - First Floor No4', nameGr: 'Superior Room - First Floor No4', descriptionEn: 'Spacious superior room with stylish decor and premium comfort.', descriptionGr: 'Spacious superior room with stylish decor and premium comfort.', type: 'BEDROOM', capacity: 3, basePrice: 210, amenities: ['Sea View', 'King Bed', 'Sofa Bed', 'Mini Bar', 'Free WiFi'] },
  { roomNumber: 5, nameEn: 'Executive Suite - First Floor No5', nameGr: 'Executive Suite - First Floor No5', descriptionEn: 'Spacious suite with separate living area and panoramic views.', descriptionGr: 'Spacious suite with separate living area and panoramic views.', type: 'STUDIO', capacity: 3, basePrice: 250, amenities: ['Panoramic View', 'Living Area', 'Jacuzzi', 'Premium Amenities', 'Free WiFi'] },
  { roomNumber: 6, nameEn: 'Panorama Room - Second Floor No6', nameGr: 'Panorama Room - Second Floor No6', descriptionEn: 'Second-floor room with expansive views and contemporary style.', descriptionGr: 'Second-floor room with expansive views and contemporary style.', type: 'BEDROOM', capacity: 3, basePrice: 240, amenities: ['Panoramic View', 'King Bed', 'Smart TV', 'Mini Bar', 'Free WiFi'] },
  { roomNumber: 7, nameEn: 'Family Suite - Second Floor No7', nameGr: 'Family Suite - Second Floor No7', descriptionEn: 'Ideal family suite with generous space and flexible sleeping setup.', descriptionGr: 'Ideal family suite with generous space and flexible sleeping setup.', type: 'STUDIO', capacity: 5, basePrice: 320, amenities: ['Sea View', '2 Bedrooms', 'Kitchenette', 'Kids Area', 'Free WiFi'] },
  { roomNumber: 8, nameEn: 'Ocean Suite - Second Floor No8', nameGr: 'Ocean Suite - Second Floor No8', descriptionEn: 'Premium suite with ocean-facing views and elevated comfort.', descriptionGr: 'Premium suite with ocean-facing views and elevated comfort.', type: 'STUDIO', capacity: 4, basePrice: 340, amenities: ['Ocean View', 'King Bed', 'Lounge Area', 'Coffee Station', 'Free WiFi'] },
  { roomNumber: 9, nameEn: 'Honeymoon Suite - Third Floor No9', nameGr: 'Honeymoon Suite - Third Floor No9', descriptionEn: 'Romantic suite designed for unforgettable stays.', descriptionGr: 'Romantic suite designed for unforgettable stays.', type: 'STUDIO', capacity: 2, basePrice: 380, amenities: ['Ocean View', 'Private Jacuzzi', 'Champagne Bar', 'Romantic Decor', 'Free WiFi'] },
  { roomNumber: 10, nameEn: 'Presidential Suite - Third Floor No10', nameGr: 'Presidential Suite - Third Floor No10', descriptionEn: 'Signature top-floor suite with the highest level of luxury.', descriptionGr: 'Signature top-floor suite with the highest level of luxury.', type: 'STUDIO', capacity: 4, basePrice: 450, amenities: ['Ocean View', '2 Bedrooms', 'Private Terrace', 'Butler Service', 'Free WiFi'] },
];

function getImagePaths(roomNumber: number): string[] {
  const publicDir = path.resolve(process.cwd(), '../incanto-hotel/public');
  if (!fs.existsSync(publicDir)) return [];

  const folders = fs.readdirSync(publicDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const folder = folders.find(f => {
    const m = f.match(/No(\d+)$/i);
    return m && Number(m[1]) === roomNumber;
  });

  if (!folder) return [];

  const roomDir = path.join(publicDir, folder);
  return fs.readdirSync(roomDir, { withFileTypes: true })
    .filter(e => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    .map(e => `/${folder}/${e.name}`.replace(/\\/g, '/'));
}

async function main() {
  // Find Incanto property
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });

  if (!incanto) {
    console.error('Incanto property not found. Run the full seed first to create the property.');
    process.exit(1);
  }

  console.log(`Found Incanto: ${incanto.id} (owner: ${incanto.ownerId})`);

  // Check for existing rooms
  const existing = await prisma.room.findMany({
    where: { propertyId: incanto.id },
  });

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing rooms — deleting them first...`);
    await prisma.room.deleteMany({ where: { propertyId: incanto.id } });
    console.log('Deleted existing rooms.');
  }

  // Create rooms
  let created = 0;
  for (const tpl of ROOMS) {
    const images = getImagePaths(tpl.roomNumber);
    await prisma.room.create({
      data: {
        propertyId: incanto.id,
        ownerId: incanto.ownerId,
        name: tpl.nameEn,
        nameEn: tpl.nameEn,
        nameGr: tpl.nameGr,
        type: tpl.type,
        capacity: tpl.capacity,
        basePrice: tpl.basePrice,
        isBookable: true,
        amenities: tpl.amenities,
        images,
        descriptionEn: tpl.descriptionEn,
        descriptionGr: tpl.descriptionGr,
      },
    });
    created++;
    console.log(`  Created room No${tpl.roomNumber}: ${tpl.nameEn} (${images.length} images)`);
  }

  // Ensure hasDynamicRooms is set
  await prisma.property.update({
    where: { id: incanto.id },
    data: { hasDynamicRooms: true },
  });

  console.log(`\nDone! Created ${created} Incanto rooms.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
