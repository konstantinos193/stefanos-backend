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

type AmenityBilingual = { en: string; el: string };

// Translation map for existing amenity strings → bilingual objects
const AMENITY_TRANSLATIONS: Record<string, AmenityBilingual> = {
  'WiFi': { en: 'WiFi', el: 'WiFi' },
  'Free WiFi': { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
  'Free Parking': { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
  'Free Private Parking': null as any, // will be removed
  'Kitchen': { en: 'Kitchen', el: 'Κουζίνα' },
  'Air Conditioning': { en: 'Air Conditioning', el: 'Κλιματισμός' },
  'Balcony': { en: 'Balcony', el: 'Μπαλκόνι' },
  'Garden View': { en: 'Garden View', el: 'Θέα στον Κήπο' },
  'Sea View': { en: 'Sea View', el: 'Θέα στη Θάλασσα' },
  'Living Area': { en: 'Living Area', el: 'Χώρος Καθιστικού' },
  'Panoramic View': { en: 'Panoramic View', el: 'Πανοραμική Θέα' },
  '2 Bedrooms': { en: '2 Bedrooms', el: '2 Υπνοδωμάτια' },
  'Ocean View': { en: 'Ocean View', el: 'Θέα στη Θάλασσα' },
  'Smart TV': { en: 'Smart TV', el: 'Smart TV' },
  'Mini Bar': { en: 'Mini Bar', el: 'Mini Bar' },
  'Bathroom': { en: 'Bathroom', el: 'Μπάνιο' },
  'Dining Area': { en: 'Dining Area', el: 'Χώρος Τραπεζαρίας' },
  'Pet Friendly': { en: 'Pet Friendly', el: 'Κατοικίδια Επιτρέπονται' },
};

const AMENITIES_ALL_ROOMS: AmenityBilingual[] = [
  { en: 'WiFi', el: 'WiFi' },
  { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
  { en: 'Kitchen', el: 'Κουζίνα' },
  { en: 'Air Conditioning', el: 'Κλιματισμός' },
  { en: 'Dining Area', el: 'Χώρος Τραπεζαρίας' },
];

// Room-specific extra amenities (by room number)
const ROOM_EXTRA_AMENITIES: Record<number, AmenityBilingual[]> = {
  1: [{ en: 'Balcony', el: 'Μπαλκόνι' }],
  2: [{ en: 'Garden View', el: 'Θέα στον Κήπο' }, { en: 'Pet Friendly', el: 'Κατοικίδια Επιτρέπονται' }],
  3: [{ en: 'Sea View', el: 'Θέα στη Θάλασσα' }],
  4: [{ en: 'Balcony', el: 'Μπαλκόνι' }],
  5: [{ en: 'Living Area', el: 'Χώρος Καθιστικού' }],
  6: [{ en: 'Panoramic View', el: 'Πανοραμική Θέα' }],
  7: [{ en: '2 Bedrooms', el: '2 Υπνοδωμάτια' }],
  8: [{ en: 'Sea View', el: 'Θέα στη Θάλασσα' }],
  9: [{ en: 'Sea View', el: 'Θέα στη Θάλασσα' }],
  10: [{ en: '2 Bedrooms', el: '2 Υπνοδωμάτια' }],
};

function getRoomNumber(name: string): number | null {
  const match = name.match(/(?:Apartment|No|#)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

async function main() {
  console.log('🔍 Finding L\'Incanto property...');
  const property = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
    include: { rooms: true },
  });

  if (!property) {
    console.error('❌ L\'Incanto property not found');
    process.exit(1);
  }

  console.log(`✅ Found property: ${property.titleEn} with ${property.rooms.length} rooms`);

  for (const room of property.rooms) {
    const roomNum = getRoomNumber(room.nameEn || room.name || '');
    if (!roomNum) {
      console.warn(`⚠️  Could not determine room number for: ${room.nameEn || room.name}`);
      continue;
    }

    const amenities: AmenityBilingual[] = [
      ...AMENITIES_ALL_ROOMS,
      ...(ROOM_EXTRA_AMENITIES[roomNum] || []),
    ];

    await prisma.room.update({
      where: { id: room.id },
      data: { amenities: amenities as any },
    });

    console.log(`✅ Updated Room ${roomNum} (${room.nameEn || room.name}):`, amenities.map(a => a.en).join(', '));
  }

  console.log('\n🎉 Done! All room amenities updated.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
