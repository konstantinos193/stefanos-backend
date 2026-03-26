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

type RoomTypeSeed = 'BEDROOM' | 'STUDIO' | 'APARTMENT';

interface RoomTemplate {
  roomNumber: number;
  nameEn: string;
  nameGr: string;
  descriptionEn: string;
  descriptionGr: string;
  type: RoomTypeSeed;
  capacity: number;
  maxAdults?: number;
  maxChildren?: number;
  maxInfants?: number;
  basePrice: number;
  isBookable?: boolean;
  amenities: { en: string; el: string }[];
}

const ROOMS: RoomTemplate[] = [
  {
    roomNumber: 1,
    nameEn: 'Apartment 01 – Ground Level',
    nameGr: 'Διαμέρισμα 01 – Ισόγειο',
    descriptionEn: 'A refined ground-level apartment designed for comfort and effortless elegance. Featuring a spacious layout, modern furnishings, and direct access convenience, this residence offers a calm and private atmosphere ideal for relaxation. Thoughtfully styled with premium details, it combines functionality with understated luxury for a truly comfortable stay.',
    descriptionGr: 'Ένα κομψό διαμέρισμα στο ισόγειο, σχεδιασμένο για άνεση και διακριτική πολυτέλεια. Διαθέτει ευρύχωρη διαρρύθμιση, σύγχρονη επίπλωση και εύκολη πρόσβαση, προσφέροντας μια ήρεμη και ιδιωτική ατμόσφαιρα ιδανική για ξεκούραση. Με προσεγμένες λεπτομέρειες και υψηλή αισθητική, συνδυάζει λειτουργικότητα και ποιότητα για μια ξεχωριστή διαμονή.',
    type: 'APARTMENT', capacity: 4, maxAdults: 2, maxChildren: 2,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Satellite TV Channels', el: 'Δορυφορικά Κανάλια TV' },
      { en: 'Fully Equipped Kitchen', el: 'Πλήρως Εξοπλισμένη Κουζίνα' },
      { en: 'Fully Equipped Bathroom', el: 'Πλήρως Εξοπλισμένο Μπάνιο' },
      { en: 'Laundry', el: 'Πλυντήριο' },
      { en: 'Free Laundry Service', el: 'Δωρεάν Υπηρεσία Πλυσίματος' },
      { en: 'Private Balcony or Ground Access', el: 'Ιδιωτικό Μπαλκόνι ή Πρόσβαση από το Έδαφος' },
      { en: 'Pet Friendly', el: 'Φιλικό προς Κατοικίδια' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 2,
    nameEn: 'Apartment 02 – Ground Level',
    nameGr: 'Διαμέρισμα 02 – Ισόγειο',
    descriptionEn: 'A spacious ground-floor apartment crafted for families and groups seeking comfort and privacy. Featuring a fully equipped kitchen, generous living spaces, and a private outdoor access point, this residence blends modern convenience with timeless elegance. Ideal for longer stays, every detail has been carefully considered to deliver a warm and welcoming home away from home.',
    descriptionGr: 'Ένα ευρύχωρο διαμέρισμα ισογείου, ιδανικό για οικογένειες και ομάδες που αναζητούν άνεση και απομόνωση. Διαθέτει πλήρως εξοπλισμένη κουζίνα, άνετους χώρους διαβίωσης και ιδιωτική πρόσβαση στον εξωτερικό χώρο. Συνδυάζει σύγχρονη πρακτικότητα με διαχρονική κομψότητα, προσφέροντας μια ζεστή και φιλόξενη ατμόσφαιρα για κάθε επισκέπτη.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4, maxChildren: 2,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Satellite TV Channels', el: 'Δορυφορικά Κανάλια TV' },
      { en: 'Fully Equipped Kitchen', el: 'Πλήρως Εξοπλισμένη Κουζίνα' },
      { en: 'Fully Equipped Bathroom', el: 'Πλήρως Εξοπλισμένο Μπάνιο' },
      { en: 'Laundry', el: 'Πλυντήριο' },
      { en: 'Balcony or Ground Access', el: 'Μπαλκόνι ή Πρόσβαση από το Έδαφος' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 3,
    nameEn: 'Apartment 03 – First Floor',
    nameGr: 'Διαμέρισμα 03 – Πρώτος Όροφος',
    descriptionEn: 'A beautifully appointed first-floor apartment designed for families, with sweeping sea views and refined coastal interiors. Ideal for families seeking tranquillity, it features generous living spaces, elegant furnishings, and a private balcony where the Ionian breeze becomes part of your morning routine. A seamless blend of comfort and natural beauty, thoughtfully arranged for an unforgettable family stay.',
    descriptionGr: 'Ένα υπέροχα διαμορφωμένο διαμέρισμα πρώτου ορόφου σχεδιασμένο για οικογένειες, με εντυπωσιακή θέα στη θάλασσα και κομψά παράκτια interiors. Ιδανικό για οικογένειες που αναζητούν ηρεμία, διαθέτει άνετους χώρους διαβίωσης, κομψή επίπλωση και ιδιωτικό μπαλκόνι όπου η Ιόνια αύρα γίνεται μέρος της καθημερινότητάς σας. Μια αρμονική σύνθεση άνεσης και φυσικής ομορφιάς, προσεκτικά διαμορφωμένη για μια αξέχαστη οικογενειακή διαμονή.',
    type: 'APARTMENT', capacity: 4, maxAdults: 2, maxChildren: 2,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'King Bed', el: 'Κρεβάτι King' },
      { en: 'Smart TV', el: 'Έξυπνη TV' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 4,
    nameEn: 'Apartment 04 – First Floor',
    nameGr: 'Διαμέρισμα 04 – Πρώτος Όροφος',
    descriptionEn: 'A superior first-floor apartment that harmoniously combines space, aesthetics, and sea views. With a king-size bed ideal for couples, it features a comfortable sofa bed. The spacious layout creates a sense of freedom, while premium amenities guarantee a stay that exceeds every expectation.',
    descriptionGr: 'Ένα εξαιρετικό διαμέρισμα πρώτου ορόφου που συνδυάζει αρμονικά χώρο, αισθητική και θέα στη θάλασσα. Με κρεβάτι king-size ιδανικό για ζευγάρια, διαθέτει  άνετο καναπέ-κρεβάτι. Η ευρεία διαρρύθμιση δημιουργεί αίσθηση ελευθερίας, ενώ τα premium amenities εγγυώνται μια παραμονή που ξεπερνά κάθε προσδοκία.',
    type: 'APARTMENT', capacity: 2, maxAdults: 2,
    basePrice: 80,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'King Bed', el: 'Κρεβάτι King' },
      { en: 'Sofa Bed', el: 'Καναπές-Κρεβάτι' },
      { en: 'Mini Bar', el: 'Mini Bar' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 5,
    nameEn: 'Apartment 05 – First Floor',
    nameGr: 'Διαμέρισμα 05 – Πρώτος Όροφος',
    descriptionEn: 'A premium first-floor apartment with impressive sea views and supreme comfort in every detail. The king-size bed and carefully curated decor create a sanctuary of sophistication and serenity. Ideal for families and those seeking a more intimate and luxurious experience by the sea.',
    descriptionGr: 'Ένα premium διαμέρισμα πρώτου ορόφου με εντυπωσιακή θέα στην θάλασσα και ανώτατη άνεση σε κάθε λεπτομέρεια. Το king-size κρεβάτι, η προσεγμένη διακόσμηση δημιουργεί ένα καταφύγιο εκλέπτυνσης και ηρεμίας. Ιδανικό για οικογένειες και όσους αναζητούν μια πιο οικεία και πολυτελή εμπειρία δίπλα στη θάλασσα.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4, maxChildren: 2,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 6,
    nameEn: 'Apartment 06 – Second Floor',
    nameGr: 'Διαμέρισμα 06 – Δεύτερος Όροφος',
    descriptionEn: 'A stunning second-floor apartment with extensive panoramic views and sophisticated modern aesthetics. The king-size bed and Smart TV create an environment of refined relaxation. Elevated above the coastline, this apartment offers an inspired and serene view of the Ionian landscape. Designed to accommodate families with up to three children, it features a bunk room and a small bed for a fifth member.',
    descriptionGr: 'Ένα εντυπωσιακό διαμέρισμα δεύτερου ορόφου με εκτεταμένη πανοραμική θέα και εκλεπτυσμένη σύγχρονη αισθητική. Το κρεβάτι king-size και η Smart TV δημιουργούν ένα περιβάλλον εκλεπτυσμένης χαλάρωσης. Υπερυψωμένο πάνω από την ακτή, αυτό το διαμέρισμα προσφέρει μια εμπνευσμένη και γαλήνια θέα στο ιόνιο τοπίο. Σχεδιασμένο για την εξυπηρέτηση οικογενειών με έως και τρία παιδιά, διαθέτει δωμάτιο με κουκέτα και ένα μικρό κρεβάτι για ένα πέμπτο μέλος.',
    type: 'APARTMENT', capacity: 5, maxAdults: 2, maxChildren: 3,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'King Bed', el: 'Κρεβάτι King' },
      { en: 'Smart TV', el: 'Έξυπνη TV' },
      { en: 'Mini Bar', el: 'Mini Bar' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 7,
    nameEn: 'Apartment 07 – Second Floor',
    nameGr: 'Διαμέρισμα 07 – Δεύτερος Όροφος',
    descriptionEn: 'An elegantly appointed second-floor apartment designed for couples seeking a refined and intimate retreat. Featuring a king-size bed, sweeping sea views, and thoughtfully curated furnishings, this residence blends comfort and coastal charm seamlessly. Every detail has been considered to create a serene and romantic atmosphere, offering an unforgettable experience by the Ionian Sea.',
    descriptionGr: 'Ένα κομψά διαμορφωμένο διαμέρισμα δεύτερου ορόφου, σχεδιασμένο για ζευγάρια που αναζητούν έναν εκλεπτυσμένο και οικείο χώρο. Με κρεβάτι king-size, εντυπωσιακή θέα στη θάλασσα και προσεγμένη επίπλωση, συνδυάζει άνεση και παράκτια γοητεία αρμονικά. Κάθε λεπτομέρεια έχει μελετηθεί για να δημιουργήσει μια γαλήνια και ρομαντική ατμόσφαιρα, προσφέροντας μια αξέχαστη εμπειρία δίπλα στο Ιόνιο Πέλαγος.',
    type: 'APARTMENT', capacity: 2, maxAdults: 2,
    basePrice: 80,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'King Bed', el: 'Κρεβάτι King' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 8,
    nameEn: 'Apartment 08 – Second Floor',
    nameGr: 'Διαμέρισμα 08 – Δεύτερος Όροφος',
    descriptionEn: 'A premium second-floor apartment with impressive sea views and supreme comfort in every detail. The king-size bed and carefully curated decor create a sanctuary of sophistication and serenity. Ideal for families and those seeking a more intimate and luxurious experience by the sea.',
    descriptionGr: 'Ένα premium διαμέρισμα δεύτερου ορόφου με εντυπωσιακή θέα στην θάλασσα και ανώτατη άνεση σε κάθε λεπτομέρεια. Το king-size κρεβάτι, η προσεγμένη διακόσμηση δημιουργεί ένα καταφύγιο εκλέπτυνσης και ηρεμίας. Ιδανικό για οικογένειες και όσους αναζητούν μια πιο οικεία και πολυτελή εμπειρία δίπλα στη θάλασσα.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4, maxChildren: 2,
    basePrice: 90,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'King Bed', el: 'Κρεβάτι King' },
      { en: 'Lounge Area', el: 'Χώρος Καθιστικού' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 9,
    nameEn: 'Apartment 09 – Third Floor',
    nameGr: 'Διαμέρισμα 09 – Τρίτος Όροφος',
    descriptionEn: 'An incomparably romantic third-floor apartment, created for couples who wish to celebrate life\'s most precious moments. Its romantic decor embraces the beauty of the Ionian horizon, this apartment transforms every evening into an unforgettable memory. The pinnacle of the romantic experience at L\'Incanto.',
    descriptionGr: 'Ένα απαράμιλλα ρομαντικό διαμέρισμα τρίτου ορόφου, δημιουργημένο για ζευγάρια που επιθυμούν να γιορτάσουν τις πιο πολύτιμες στιγμές της ζωής τους. Η ρομαντική διακόσμησή του αγκαλιάζει την ομορφιά του Ιόνιου ορίζοντα, αυτό το διαμέρισμα μετατρέπει κάθε βράδυ σε αξέχαστη ανάμνηση. Η κορύφωση της ρομαντικής εμπειρίας στο L\'Incanto.',
    type: 'APARTMENT', capacity: 2, maxAdults: 2,
    basePrice: 80,
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: 'Private Jacuzzi', el: 'Ιδιωτικό Jacuzzi' },
      { en: 'Champagne Bar', el: 'Champagne Bar' },
      { en: 'Romantic Decor', el: 'Ρομαντική Διακόσμηση' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Balcony', el: 'Μπαλκόνι' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
  {
    roomNumber: 10,
    nameEn: 'Apartment 10 – Third Floor',
    nameGr: 'Διαμέρισμα 10 – Τρίτος Όροφος',
    descriptionEn:
      "The crown jewel of L'Incanto, this prestigious third-floor apartment defines the ultimate luxury experience. With two full bedrooms and a sweeping private terrace overlooking the Ionian Sea, this residence sets an unrivalled standard of sophistication. Reserved for the most discerning guests, it offers an incomparable blend of space, elegance, and personalised hospitality.",
    descriptionGr:
      "Το στολίδι του L'Incanto, αυτό το λαμπρό διαμέρισμα τρίτου ορόφου ορίζει την απόλυτη εμπειρία πολυτέλειας. Με δύο πλήρη υπνοδωμάτια και εκτεταμένη ιδιωτική βεράντα με θέα στο Ιόνιο Πέλαγος, θέτει ένα ασύγκριτο πρότυπο εκλέπτυνσης. Κατάλληλο για τους πιο απαιτητικούς επισκέπτες, προσφέρει έναν ασύγκριτο συνδυασμό χώρου, κομψότητας και εξατομικευμένης φιλοξενίας.",
    type: 'APARTMENT', capacity: 4, maxAdults: 4, maxChildren: 2,
    basePrice: 450,
    isBookable: false, // Closed for the entire summer
    amenities: [
      { en: 'Sea View', el: 'Θέα Θάλασσας' },
      { en: '2 Bedrooms', el: '2 Υπνοδωμάτια' },
      { en: 'Private Terrace', el: 'Ιδιωτική Βεράντα' },
      { en: 'Free WiFi', el: 'Δωρεάν WiFi' },
      { en: 'Free Parking', el: 'Δωρεάν Πάρκινγκ' },
      { en: 'Free Air Conditioning', el: 'Δωρεάν Κλιματισμός' },
      { en: 'Dining Area', el: 'Τραπεζαρία' }
    ],
  },
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

function getRoom1SpecificImages(): string[] {
  return [
    '/1. ground floor No1/MTS_1701-Edit-2.jpg',
    '/1. ground floor No1/MTS_1703-Edit-Edit.jpg',
    '/1. ground floor No1/MTS_1707-Edit.jpg',
    '/1. ground floor No1/MTS_0729.jpg',
    '/1. ground floor No1/MTS_0903-Edit-2.jpg',
    '/1. ground floor No1/MTS_0907-Edit-2.jpg',
    '/1. ground floor No1/MTS_0926-Edit.jpg',
    '/1. ground floor No1/MTS_1690-Edit.jpg',
    '/1. ground floor No1/MTS_1694-Edit.jpg'
  ];
}

function getRoom2SpecificImages(): string[] {
  return [
    '/2. ground floor No2/MTS_0959-Edit-2.jpg',
    '/2. ground floor No2/MTS_0940-Edit-2.jpg',
    '/2. ground floor No2/MTS_0971.jpg',
    '/2. ground floor No2/NZ6_5289-Edit.jpg',
    '/2. ground floor No2/NZ6_5296.jpg',
    '/2. ground floor No2/NZ6_5302.jpg',
    '/2. ground floor No2/NZ6_5303-Edit.jpg',
    '/2. ground floor No2/NZ6_5312.jpg',
    '/2. ground floor No2/NZ6_5314.jpg',
    '/2. ground floor No2/NZ6_5315.jpg',
    '/2. ground floor No2/NZ6_5340.jpg',
    '/2. ground floor No2/NZ6_5351.jpg',
    '/2. ground floor No2/NZ6_5354.jpg'
  ];
}

function getRoom3SpecificImages(): string[] {
  return [
    '/3. first floor No3/MTS_1433-Edit-2.jpg',
    '/3. first floor No3/MTS_1364-Edit-Edit.jpg',
    '/3. first floor No3/MTS_1374-HDR-Edit-2.jpg',
    '/3. first floor No3/MTS_1389-Edit.jpg',
    '/3. first floor No3/MTS_1413-Edit-Edit.jpg',
    '/3. first floor No3/MTS_1425-HDR-2.jpg',
    '/3. first floor No3/MTS_1447-Edit-Edit-Edit.jpg',
    '/3. first floor No3/MTS_1456-Edit-Edit.jpg',
    '/3. first floor No3/NZ6_4973-2.jpg',
    '/3. first floor No3/NZ6_4977-2.jpg',
    '/3. first floor No3/NZ6_4979-3.jpg',
    '/3. first floor No3/NZ6_4989-Edit.jpg',
    '/3. first floor No3/NZ6_5096-Edit-Edit.jpg',
    '/3. first floor No3/THUMBNAIL.jpg'
  ];
}

function getRoom4SpecificImages(): string[] {
  return [
    '/4. first floor No4/MTS_1017-Edit-2.jpg',
    '/4. first floor No4/MTS_1000-Edit.jpg',
    '/4. first floor No4/MTS_1011-Edit.jpg',
    '/4. first floor No4/MTS_1030-Edit-2.jpg',
    '/4. first floor No4/MTS_1042-Edit-Edit.jpg',
    '/4. first floor No4/MTS_1050-Edit-2.jpg',
    '/4. first floor No4/MTS_1316-Edit.jpg',
    '/4. first floor No4/NZ6_5112-Edit-Edit.jpg',
    '/4. first floor No4/NZ6_5132.jpg',
    '/4. first floor No4/NZ6_5133.jpg',
    '/4. first floor No4/NZ6_5144-Edit-2.jpg',
    '/4. first floor No4/NZ6_5150-Edit-2.jpg',
    '/4. first floor No4/NZ6_5151-Edit.jpg'
  ];
}

function getRoom5SpecificImages(): string[] {
  return [
    '/5. first floor No5/MTS_1079-Edit-2.jpg',
    '/5. first floor No5/MTS_1061-Edit-2.jpg',
    '/5. first floor No5/MTS_1069-Edit-Edit.jpg',
    '/5. first floor No5/MTS_1081-HDR-Edit-2.jpg',
    '/5. first floor No5/MTS_1088-Edit.jpg',
    '/5. first floor No5/NZ6_4955.jpg',
    '/5. first floor No5/NZ6_5192-Edit-2.jpg',
    '/5. first floor No5/NZ6_5195-Edit-2.jpg',
    '/5. first floor No5/NZ6_5206-Edit.jpg',
    '/5. first floor No5/NZ6_5213-Edit.jpg',
    '/5. first floor No5/NZ6_5223.jpg',
    '/5. first floor No5/NZ6_5238.jpg',
    '/5. first floor No5/NZ6_5265.jpg'
  ];
}

function getRoom6SpecificImages(): string[] {
  return [
    '/6. second floor No6/NZ6_4764.jpg',
    '/6. second floor No6/MTS_1144-Edit-2.jpg',
    '/6. second floor No6/MTS_1160-HDR-Edit-2.jpg',
    '/6. second floor No6/MTS_1170-Edit-2.jpg',
    '/6. second floor No6/MTS_1175-HDR-Edit-Edit.jpg',
    '/6. second floor No6/MTS_1188-Edit-2.jpg',
    '/6. second floor No6/NZ6_4706.jpg',
    '/6. second floor No6/NZ6_4708.jpg',
    '/6. second floor No6/NZ6_4717-Edit.jpg',
    '/6. second floor No6/NZ6_4740.jpg',
    '/6. second floor No6/NZ6_4760-Edit-Edit.jpg'
  ];
}

function getRoom7SpecificImages(): string[] {
  return [
    '/7. second floor No7/MTS_1683-Edit-2.jpg',
    '/7. second floor No7/MTS_1203-HDR-Edit-Edit.jpg',
    '/7. second floor No7/MTS_1663-HDR-Edit.jpg',
    '/7. second floor No7/MTS_1671-Edit.jpg',
    // NZ6_4696-2.jpg removed (photo 6 – does not belong to this apartment)
    '/7. second floor No7/NZ6_4790-Edit-2.jpg',
    '/7. second floor No7/NZ6_4807-Edit.jpg',
    '/7. second floor No7/NZ6_4811.jpg',
    '/7. second floor No7/NZ6_4812-Edit.jpg',
    '/7. second floor No7/NZ6_4819-Edit.jpg',
    '/7. second floor No7/NZ6_4834-Edit.jpg',
    '/7. second floor No7/NZ6_4849.jpg'
  ];
}

function getRoom8SpecificImages(): string[] {
  return [
    '/8. second floor No8/MTS_1237-HDR-Edit-Edit.jpg',
    '/8. second floor No8/MTS_1227-HDR-Edit-Edit.jpg',
    '/8. second floor No8/MTS_1254-Edit.jpg',
    '/8. second floor No8/MTS_1261-HDR-Edit-Edit.jpg',
    '/8. second floor No8/MTS_1279-Edit-2.jpg',
    '/8. second floor No8/MTS_1285-HDR-Edit-Edit.jpg',
    '/8. second floor No8/MTS_1292-Edit-2-Edit.jpg',
    '/8. second floor No8/MTS_1302-HDR-Edit.jpg',
    '/8. second floor No8/NZ6_4854-Edit-2.jpg',
    '/8. second floor No8/NZ6_4856.jpg',
    '/8. second floor No8/NZ6_4890.jpg',
    '/8. second floor No8/NZ6_4903-Edit.jpg',
    '/8. second floor No8/NZ6_4905.jpg',
    '/8. second floor No8/NZ6_4917.jpg',
    '/8. second floor No8/NZ6_4920.jpg',
    '/8. second floor No8/NZ6_4930-Edit.jpg',
    '/8. second floor No8/NZ6_4934-Edit.jpg',
    '/8. second floor No8/NZ6_4944.jpg'
  ];
}

function getRoom9SpecificImages(): string[] {
  return [
    '/9. third floor No9/MTS_1108-Edit-Edit.jpg',
    '/9. third floor No9/MTS_1114-HDR-Edit-2.jpg',
    '/9. third floor No9/MTS_1127-HDR-Edit.jpg',
    '/9. third floor No9/MTS_1137-HDR.jpg',
    '/9. third floor No9/MTS_1137-HDR-Edit.jpg',
    '/9. third floor No9/MTS_1467-Edit-Edit.jpg',
    '/9. third floor No9/MTS_1480-Edit-2.jpg',
    '/9. third floor No9/MTS_1493-Edit-2.jpg',
    '/9. third floor No9/MTS_1503.jpg',
    '/9. third floor No9/MTS_1508-Edit-2.jpg',
    '/9. third floor No9/MTS_1511-Edit-2.jpg',
    '/9. third floor No9/MTS_1529-HDR-Edit-2.jpg',
    '/9. third floor No9/MTS_1534-HDR-Edit-2.jpg',
    '/9. third floor No9/NZ6_4526-Edit-2.jpg',
    '/9. third floor No9/NZ6_4541-Edit-Edit.jpg',
    '/9. third floor No9/NZ6_4581-2.jpg',
    '/9. third floor No9/NZ6_4597-Edit.jpg',
    '/9. third floor No9/NZ6_4617.jpg',
    '/9. third floor No9/NZ6_4648-2.jpg',
    '/9. third floor No9/NZ6_5398.jpg',
    '/9. third floor No9/NZ6_5399-Edit.jpg'
  ];
}

function getRoom10SpecificImages(): string[] {
  return [
    // Photo 4 set as main (first)
    '/10. third floor No10/MTS_1586-HDR-Edit-2.jpg',
    '/10. third floor No10/MTS_1545-HDR-Edit-2.jpg',
    '/10. third floor No10/MTS_1563-Edit.jpg',
    // MTS_1579-HDR-Edit.jpg removed (photo 3 – duplicate/redundant)
    '/10. third floor No10/MTS_1598-HDR-Edit-Edit.jpg',
    '/10. third floor No10/MTS_1609-HDR-Edit-2.jpg',
    '/10. third floor No10/MTS_1613-Edit.jpg',
    '/10. third floor No10/MTS_1632-Edit-2.jpg',
    '/10. third floor No10/MTS_1640-HDR-Edit-2.jpg',
    '/10. third floor No10/NZ6_4294-HDR.jpg',
    '/10. third floor No10/NZ6_4306-3.jpg',
    '/10. third floor No10/NZ6_4307-Edit-2.jpg',
    '/10. third floor No10/NZ6_4326.jpg',
    '/10. third floor No10/NZ6_4327-2.jpg',
    '/10. third floor No10/NZ6_4328.jpg',
    '/10. third floor No10/NZ6_4361.jpg',
    '/10. third floor No10/NZ6_4374.jpg',
    '/10. third floor No10/NZ6_4391.jpg',
    '/10. third floor No10/NZ6_4411.jpg',
    '/10. third floor No10/NZ6_4430-Edit-3.jpg',
    '/10. third floor No10/NZ6_4440-Edit-Edit.jpg',
    '/10. third floor No10/NZ6_4451-2.jpg',
    '/10. third floor No10/NZ6_4673.jpg',
    '/10. third floor No10/NZ6_4676-2.jpg',
    '/10. third floor No10/NZ6_5390.jpg',
    '/10. third floor No10/NZ6_5392-Edit.jpg',
    '/10. third floor No10/NZ6_5395-Recovered-2.jpg'
  ];
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
    let images: string[];
    switch (tpl.roomNumber) {
      case 1:
        images = getRoom1SpecificImages();
        break;
      case 2:
        images = getRoom2SpecificImages();
        break;
      case 3:
        images = getRoom3SpecificImages();
        break;
      case 4:
        images = getRoom4SpecificImages();
        break;
      case 5:
        images = getRoom5SpecificImages();
        break;
      case 6:
        images = getRoom6SpecificImages();
        break;
      case 7:
        images = getRoom7SpecificImages();
        break;
      case 8:
        images = getRoom8SpecificImages();
        break;
      case 9:
        images = getRoom9SpecificImages();
        break;
      case 10:
        images = getRoom10SpecificImages();
        break;
      default:
        images = getImagePaths(tpl.roomNumber);
    }
    
    await prisma.room.create({
      data: {
        propertyId: incanto.id,
        ownerId: incanto.ownerId,
        name: tpl.nameEn,
        nameEn: tpl.nameEn,
        nameGr: tpl.nameGr,
        type: tpl.type,
        capacity: tpl.capacity,
        maxAdults: tpl.maxAdults || tpl.capacity, // Default to total capacity if not specified
        basePrice: tpl.basePrice,
        isBookable: tpl.isBookable !== undefined ? tpl.isBookable : true,
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
