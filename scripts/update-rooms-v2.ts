/**
 * Update Incanto rooms and property with the following changes:
 *
 * Room 01: Add 'Pet Friendly' amenity
 * Room 02: Remove 'Living Room with Sofa Bed' amenity
 * Room 03: Set capacity=4, maxAdults=4, update description (designed for families)
 * Room 04: Set capacity=2, maxAdults=2
 * Room 05: Remove 'Jacuzzi' and 'Living Area' amenities, update description
 * Room 07: Set capacity=2, maxAdults=2, update description (for couples), remove image 6
 * Room 10: Set photo 4 as main, remove photo 3, remove 'Butler Service', update description
 * Property: Update name and address
 *
 * Usage: npx tsx scripts/update-rooms-v2.ts
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

function getRoomNumber(nameEn: string | null): number | null {
  if (!nameEn) return null;
  const match = nameEn.match(/Apartment\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

async function main() {
  // Find Incanto property
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });

  if (!incanto) {
    console.error('Incanto property not found.');
    process.exit(1);
  }

  console.log(`Found Incanto: ${incanto.id}`);

  // Update property name and address
  await prisma.property.update({
    where: { id: incanto.id },
    data: {
      titleEn: "L'INCANTO Boutique apartments",
      address: 'Αριστοτέλους 26, ΔΡΟΣΙΑ ΠΡΕΒΕΖΑΣ',
    },
  });
  console.log("  ✓ Property: name and address updated");

  // Fetch all incanto rooms
  const rooms = await prisma.room.findMany({
    where: { propertyId: incanto.id },
    select: { id: true, nameEn: true, capacity: true, maxAdults: true, amenities: true, images: true },
  });

  console.log(`\nFound ${rooms.length} rooms. Updating...\n`);

  for (const room of rooms) {
    const num = getRoomNumber(room.nameEn);
    if (!num) {
      console.log(`  - Skipping "${room.nameEn}" (no room number found)`);
      continue;
    }

    const amenities: string[] = Array.isArray(room.amenities) ? (room.amenities as string[]) : [];
    const images: string[] = Array.isArray(room.images) ? (room.images as string[]) : [];

    // ── Room 01 ──────────────────────────────────────────────────────────────
    if (num === 1) {
      const newAmenities = amenities.includes('Pet Friendly')
        ? amenities
        : [...amenities, 'Pet Friendly'];

      await prisma.room.update({
        where: { id: room.id },
        data: { amenities: newAmenities },
      });
      console.log(`  ✓ Room 01: added 'Pet Friendly' amenity`);
    }

    // ── Room 02 ──────────────────────────────────────────────────────────────
    if (num === 2) {
      const newAmenities = amenities.filter(
        (a) => a.toLowerCase() !== 'living room with sofa bed',
      );

      await prisma.room.update({
        where: { id: room.id },
        data: { amenities: newAmenities },
      });
      console.log(`  ✓ Room 02: removed 'Living Room with Sofa Bed' amenity`);
    }

    // ── Room 03 ──────────────────────────────────────────────────────────────
    if (num === 3) {
      await prisma.room.update({
        where: { id: room.id },
        data: {
          capacity: 4,
          maxAdults: 4,
          descriptionEn:
            "A beautifully appointed first-floor apartment designed for families, with sweeping sea views and refined coastal interiors. Ideal for families seeking tranquillity, it features generous living spaces, elegant furnishings, and a private balcony where the Ionian breeze becomes part of your morning routine. A seamless blend of comfort and natural beauty, thoughtfully arranged for an unforgettable family stay.",
          descriptionGr:
            "Ένα υπέροχα διαμορφωμένο διαμέρισμα πρώτου ορόφου σχεδιασμένο για οικογένειες, με εντυπωσιακή θέα στη θάλασσα και κομψά παράκτια interiors. Ιδανικό για οικογένειες που αναζητούν ηρεμία, διαθέτει άνετους χώρους διαβίωσης, κομψή επίπλωση και ιδιωτικό μπαλκόνι όπου η Ιόνια αύρα γίνεται μέρος της καθημερινότητάς σας. Μια αρμονική σύνθεση άνεσης και φυσικής ομορφιάς, προσεκτικά διαμορφωμένη για μια αξέχαστη οικογενειακή διαμονή.",
        },
      });
      console.log(`  ✓ Room 03: capacity → 4, description updated (designed for families)`);
    }

    // ── Room 04 ──────────────────────────────────────────────────────────────
    if (num === 4) {
      await prisma.room.update({
        where: { id: room.id },
        data: { capacity: 2, maxAdults: 2 },
      });
      console.log(`  ✓ Room 04: capacity → 2`);
    }

    // ── Room 05 ──────────────────────────────────────────────────────────────
    if (num === 5) {
      const newAmenities = amenities.filter(
        (a) =>
          !a.toLowerCase().includes('jacuzzi') &&
          !a.toLowerCase().includes('living area') &&
          !a.toLowerCase().includes('lounge'),
      );

      await prisma.room.update({
        where: { id: room.id },
        data: {
          amenities: newAmenities,
          descriptionEn:
            "An executive first-floor apartment offering panoramic sea and landscape views from every angle. Featuring premium furnishings and a refined aesthetic, this residence provides an elevated living experience at L'Incanto. Ideal for those who demand both style and substance, it delivers a memorable experience of luxury by the Ionian Sea.",
          descriptionGr:
            "Ένα executive διαμέρισμα πρώτου ορόφου με πανοραμική θέα στη θάλασσα και τον ορίζοντα. Διαθέτει premium επίπλωση και εκλεπτυσμένη αισθητική, προσφέροντας μια ανώτερη εμπειρία διαβίωσης στο L'Incanto. Ιδανικό για όσους αναζητούν στυλ και ουσία, προσφέρει μια αξέχαστη εμπειρία πολυτέλειας στο Ιόνιο Πέλαγος.",
        },
      });
      console.log(`  ✓ Room 05: removed Jacuzzi/Living Area amenities, description updated`);
    }

    // ── Room 07 ──────────────────────────────────────────────────────────────
    if (num === 7) {
      // Remove photo 6 (index 5 = NZ6_4696-2.jpg)
      const newImages = images.filter(
        (img) => !img.includes('NZ6_4696-2.jpg'),
      );

      await prisma.room.update({
        where: { id: room.id },
        data: {
          capacity: 2,
          maxAdults: 2,
          images: newImages,
          descriptionEn:
            "An elegantly appointed second-floor apartment designed for couples seeking a refined and intimate retreat. Featuring a king-size bed, sweeping sea views, and thoughtfully curated furnishings, this residence blends comfort and coastal charm seamlessly. Every detail has been considered to create a serene and romantic atmosphere, offering an unforgettable experience by the Ionian Sea.",
          descriptionGr:
            "Ένα κομψά διαμορφωμένο διαμέρισμα δεύτερου ορόφου, σχεδιασμένο για ζευγάρια που αναζητούν έναν εκλεπτυσμένο και οικείο χώρο. Με κρεβάτι king-size, εντυπωσιακή θέα στη θάλασσα και προσεγμένη επίπλωση, συνδυάζει άνεση και παράκτια γοητεία αρμονικά. Κάθε λεπτομέρεια έχει μελετηθεί για να δημιουργήσει μια γαλήνια και ρομαντική ατμόσφαιρα, προσφέροντας μια αξέχαστη εμπειρία δίπλα στο Ιόνιο Πέλαγος.",
        },
      });
      console.log(`  ✓ Room 07: capacity → 2, description updated (for couples), image 6 removed`);
    }

    // ── Room 10 ──────────────────────────────────────────────────────────────
    if (num === 10) {
      // Remove Butler Service from amenities
      const newAmenities = amenities.filter(
        (a) => !a.toLowerCase().includes('butler'),
      );

      // Remove photo 3 (MTS_1579-HDR-Edit.jpg) and set photo 4 (MTS_1586-HDR-Edit-2.jpg) as main
      const photo3 = '/10. third floor No10/MTS_1579-HDR-Edit.jpg';
      const photo4 = '/10. third floor No10/MTS_1586-HDR-Edit-2.jpg';
      const filteredImages = images.filter((img) => img !== photo3);
      const remainingWithoutPhoto4 = filteredImages.filter((img) => img !== photo4);
      const newImages = [photo4, ...remainingWithoutPhoto4];

      await prisma.room.update({
        where: { id: room.id },
        data: {
          amenities: newAmenities,
          images: newImages,
          descriptionEn:
            "The crown jewel of L'Incanto, this prestigious third-floor apartment defines the ultimate luxury experience. With two full bedrooms and a sweeping private terrace overlooking the Ionian Sea, this residence sets an unrivalled standard of sophistication. Reserved for the most discerning guests, it offers an incomparable blend of space, elegance, and personalised hospitality.",
          descriptionGr:
            "Το στολίδι του L'Incanto, αυτό το λαμπρό διαμέρισμα τρίτου ορόφου ορίζει την απόλυτη εμπειρία πολυτέλειας. Με δύο πλήρη υπνοδωμάτια και εκτεταμένη ιδιωτική βεράντα με θέα στο Ιόνιο Πέλαγος, θέτει ένα ασύγκριτο πρότυπο εκλέπτυνσης. Κατάλληλο για τους πιο απαιτητικούς επισκέπτες, προσφέρει έναν ασύγκριτο συνδυασμό χώρου, κομψότητας και εξατομικευμένης φιλοξενίας.",
        },
      });
      console.log(`  ✓ Room 10: Butler Service removed, photo 4 set as main, photo 3 removed, description updated`);
    }
  }

  console.log('\nDone!');
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
