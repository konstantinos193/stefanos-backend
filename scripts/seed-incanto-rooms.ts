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
  amenities: string[];
}

const ROOMS: RoomTemplate[] = [
  {
    roomNumber: 1,
    nameEn: 'Apartment 01 – Ground Level',
    nameGr: 'Διαμέρισμα 01 – Ισόγειο',
    descriptionEn: 'A refined ground-level apartment designed for comfort and effortless elegance. Featuring a spacious layout, modern furnishings, and direct access convenience, this residence offers a calm and private atmosphere ideal for relaxation. Thoughtfully styled with premium details, it combines functionality with understated luxury for a truly comfortable stay.',
    descriptionGr: 'Ένα κομψό διαμέρισμα στο ισόγειο, σχεδιασμένο για άνεση και διακριτική πολυτέλεια. Διαθέτει ευρύχωρη διαρρύθμιση, σύγχρονη επίπλωση και εύκολη πρόσβαση, προσφέροντας μια ήρεμη και ιδιωτική ατμόσφαιρα ιδανική για ξεκούραση. Με προσεγμένες λεπτομέρειες και υψηλή αισθητική, συνδυάζει λειτουργικότητα και ποιότητα για μια ξεχωριστή διαμονή.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 120,
    amenities: ['Sea View', 'Free WiFi', 'Free Private Parking', 'Free Air Conditioning', 'Satellite TV Channels', 'Fully Equipped Kitchen', 'Fully Equipped Bathroom', 'Laundry', 'Free Laundry Service', 'Private Balcony or Ground Access'],
  },
  {
    roomNumber: 2,
    nameEn: 'Apartment 02 – Ground Level',
    nameGr: 'Διαμέρισμα 02 – Ισόγειο',
    descriptionEn: 'A spacious ground-floor apartment crafted for families and groups seeking comfort and privacy. Featuring a fully equipped kitchen, generous living spaces, and a private outdoor access point, this residence blends modern convenience with timeless elegance. Ideal for longer stays, every detail has been carefully considered to deliver a warm and welcoming home away from home.',
    descriptionGr: 'Ένα ευρύχωρο διαμέρισμα ισογείου, ιδανικό για οικογένειες και ομάδες που αναζητούν άνεση και απομόνωση. Διαθέτει πλήρως εξοπλισμένη κουζίνα, άνετους χώρους διαβίωσης και ιδιωτική πρόσβαση στον εξωτερικό χώρο. Συνδυάζει σύγχρονη πρακτικότητα με διαχρονική κομψότητα, προσφέροντας μια ζεστή και φιλόξενη ατμόσφαιρα για κάθε επισκέπτη.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 120,
    amenities: ['Sea View', 'Free WiFi', 'Free Private Parking', 'Free Air Conditioning', 'Satellite TV Channels', 'Fully Equipped Kitchen', 'Fully Equipped Bathroom', 'Laundry', 'Balcony or Ground Access', 'Dining Area', 'Living Room with Sofa Bed'],
  },
  {
    roomNumber: 3,
    nameEn: 'Apartment 03 – First Floor',
    nameGr: 'Διαμέρισμα 03 – Πρώτος Όροφος',
    descriptionEn: 'A beautifully appointed first-floor apartment with sweeping sea views and refined coastal interiors. Designed for couples seeking tranquillity, it features a luxurious king-size bed, elegant furnishings, and a private balcony where the Ionian breeze becomes part of your morning routine. A seamless blend of comfort and natural beauty.',
    descriptionGr: 'Ένα υπέροχα διαμορφωμένο διαμέρισμα πρώτου ορόφου με εντυπωσιακή θέα στη θάλασσα και κομψά παράκτια interiors. Σχεδιασμένο για ζευγάρια που αναζητούν ηρεμία, διαθέτει πολυτελές κρεβάτι king-size, κομψή επίπλωση και ιδιωτικό μπαλκόνι όπου η Ιόνια αύρα γίνεται μέρος της καθημερινότητάς σας. Μια αρμονική σύνθεση άνεσης και φυσικής ομορφιάς.',
    type: 'APARTMENT', capacity: 2, maxAdults: 2,
    basePrice: 180,
    amenities: ['Sea View', 'King Bed', 'Smart TV', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 4,
    nameEn: 'Apartment 04 – First Floor',
    nameGr: 'Διαμέρισμα 04 – Πρώτος Όροφος',
    descriptionEn: 'A superior first-floor apartment that effortlessly combines space, style, and sea views. With a king-size bed, a comfortable sofa bed, and a well-stocked mini bar, this residence caters to small groups and couples alike. Its thoughtfully designed layout creates a sense of openness, while premium amenities ensure a stay that exceeds expectations.',
    descriptionGr: 'Ένα εξαιρετικό διαμέρισμα πρώτου ορόφου που συνδυάζει αρμονικά χώρο, αισθητική και θέα στη θάλασσα. Με κρεβάτι king-size, άνετο καναπέ-κρεβάτι και mini bar, εξυπηρετεί μικρές παρέες και ζευγάρια. Η ευρεία διαρρύθμιση δημιουργεί αίσθηση ελευθερίας, ενώ τα premium amenities εγγυώνται μια παραμονή που ξεπερνά κάθε προσδοκία.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 210,
    amenities: ['Sea View', 'King Bed', 'Sofa Bed', 'Mini Bar', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 5,
    nameEn: 'Apartment 05 – First Floor',
    nameGr: 'Διαμέρισμα 05 – Πρώτος Όροφος',
    descriptionEn: 'An executive first-floor apartment offering panoramic sea and landscape views from every angle. Featuring a private jacuzzi, a separate lounge area, and premium furnishings, this residence sets the standard for elevated living at L\'Incanto. Ideal for those who demand both style and substance, it delivers an unforgettable experience of luxury by the Ionian Sea.',
    descriptionGr: 'Ένα executive διαμέρισμα πρώτου ορόφου με πανοραμική θέα στη θάλασσα και τον ορίζοντα. Διαθέτει ιδιωτικό jacuzzi, χωριστό χώρο καθιστικού και premium επίπλωση, θέτοντας το πρότυπο για ανώτερη διαβίωση στο L\'Incanto. Ιδανικό για όσους αναζητούν στυλ και ουσία, προσφέρει μια αξέχαστη εμπειρία πολυτέλειας στο Ιόνιο Πέλαγος.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 250,
    amenities: ['Sea View', 'Jacuzzi', 'Living Area', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 6,
    nameEn: 'Apartment 06 – Second Floor',
    nameGr: 'Διαμέρισμα 06 – Δεύτερος Όροφος',
    descriptionEn: 'A stunning second-floor apartment with expansive panoramic views and a sophisticated modern aesthetic. The generously sized king-size bed, sleek mini bar, and contemporary Smart TV create an environment of refined relaxation. Elevated above the coastline, this apartment offers an immersive perspective of the Ionian landscape that is both inspiring and serene.',
    descriptionGr: 'Ένα εντυπωσιακό διαμέρισμα δεύτερου ορόφου με εκτεταμένη πανοραμική θέα και εκλεπτυσμένη σύγχρονη αισθητική. Το κρεβάτι king-size, το κομψό mini bar και το Smart TV δημιουργούν ένα περιβάλλον εκλεπτυσμένης χαλάρωσης. Υπερυψωμένο πάνω από την ακτή, αυτό το διαμέρισμα προσφέρει μια εμπνευσμένη και γαλήνια θέα στο ιόνιο τοπίο.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 240,
    amenities: ['Sea View', 'King Bed', 'Smart TV', 'Mini Bar', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 7,
    nameEn: 'Apartment 07 – Second Floor',
    nameGr: 'Διαμέρισμα 07 – Δεύτερος Όροφος',
    descriptionEn: 'A thoughtfully designed family apartment on the second floor, featuring two separate bedrooms, a fully equipped kitchenette, and a dedicated children\'s area. With sea views and generous living spaces, this residence is the perfect retreat for families who want to enjoy the beauty of the Ionian coast together without sacrificing comfort or privacy.',
    descriptionGr: 'Ένα προσεκτικά σχεδιασμένο οικογενειακό διαμέρισμα δεύτερου ορόφου, με δύο ξεχωριστά υπνοδωμάτια, πλήρως εξοπλισμένο kitchenette και παιδικό χώρο. Με θέα στη θάλασσα και άνετους χώρους διαβίωσης, αποτελεί το ιδανικό καταφύγιο για οικογένειες που θέλουν να απολαύσουν μαζί την ομορφιά της Ιόνιας ακτής χωρίς να θυσιάσουν άνεση ή ιδιωτικότητα.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 320,
    amenities: ['Sea View', '2 Bedrooms', 'Kitchenette', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 8,
    nameEn: 'Apartment 08 – Second Floor',
    nameGr: 'Διαμέρισμα 08 – Δεύτερος Όροφος',
    descriptionEn: 'A premium second-floor apartment with breathtaking ocean-facing views and elevated comfort throughout. The king-size bed, dedicated lounge area, and carefully curated decor create a sanctuary of sophistication and peace. Perfect for those who seek a more intimate and luxurious experience by the sea, where every moment feels like an escape.',
    descriptionGr: 'Ένα premium διαμέρισμα δεύτερου ορόφου με εντυπωσιακή θέα στον ωκεανό και ανώτατη άνεση σε κάθε λεπτομέρεια. Το king-size κρεβάτι, ο χωριστός χώρος καθιστικού και η προσεγμένη διακόσμηση δημιουργούν ένα καταφύγιο εκλέπτυνσης και ηρεμίας. Ιδανικό για όσους αναζητούν μια πιο οικεία και πολυτελή εμπειρία δίπλα στη θάλασσα.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 340,
    amenities: ['Sea View', 'King Bed', 'Lounge Area', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 9,
    nameEn: 'Apartment 09 – Third Floor',
    nameGr: 'Διαμέρισμα 09 – Τρίτος Όροφος',
    descriptionEn: 'An exquisitely romantic third-floor apartment, created for couples who wish to celebrate life\'s most precious moments. Featuring a private jacuzzi, an intimate champagne bar, and romantic decor that embraces the beauty of the Ionian horizon, this apartment transforms every evening into an unforgettable memory. The pinnacle of romance at L\'Incanto.',
    descriptionGr: 'Ένα απαράμιλλα ρομαντικό διαμέρισμα τρίτου ορόφου, δημιουργημένο για ζευγάρια που επιθυμούν να γιορτάσουν τις πιο πολύτιμες στιγμές της ζωής τους. Με ιδιωτικό jacuzzi, οικείο champagne bar και ρομαντική διακόσμηση που αγκαλιάζει την ομορφιά του Ιόνιου ορίζοντα, αυτό το διαμέρισμα μετατρέπει κάθε βράδυ σε αξέχαστη ανάμνηση. Η κορύφωση της ρομαντικής εμπειρίας στο L\'Incanto.',
    type: 'APARTMENT', capacity: 2, maxAdults: 2,
    basePrice: 380,
    amenities: ['Sea View', 'Private Jacuzzi', 'Champagne Bar', 'Romantic Decor', 'Free WiFi', 'Free Air Conditioning', 'Balcony'],
  },
  {
    roomNumber: 10,
    nameEn: 'Apartment 10 – Third Floor',
    nameGr: 'Διαμέρισμα 10 – Τρίτος Όροφος',
    descriptionEn: 'The crown jewel of L\'Incanto, this prestigious third-floor apartment defines the ultimate luxury experience. With two full bedrooms, a sweeping private terrace overlooking the Ionian Sea, and exclusive butler service, this residence sets an unrivalled standard of sophistication. Reserved for the most discerning guests, it offers an incomparable blend of space, elegance, and personalised hospitality.',
    descriptionGr: 'Το στολίδι του L\'Incanto, αυτό το λαμπρό διαμέρισμα τρίτου ορόφου ορίζει την απόλυτη εμπειρία πολυτέλειας. Με δύο πλήρη υπνοδωμάτια, εκτεταμένη ιδιωτική βεράντα με θέα στο Ιόνιο Πέλαγος και αποκλειστική υπηρεσία butler, θέτει ένα ασύγκριτο πρότυπο εκλέπτυνσης. Κατάλληλο για τους πιο απαιτητικούς επισκέπτες, προσφέρει έναν ασύγκριτο συνδυασμό χώρου, κομψότητας και εξατομικευμένης φιλοξενίας.',
    type: 'APARTMENT', capacity: 4, maxAdults: 4,
    basePrice: 450,
    amenities: ['Sea View', '2 Bedrooms', 'Private Terrace', 'Butler Service', 'Free WiFi', 'Free Air Conditioning'],
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
    '/7. second floor No7/MTS_1190-Edit-Edit.jpg',
    '/7. second floor No7/MTS_1203-HDR-Edit-Edit.jpg',
    '/7. second floor No7/MTS_1663-HDR-Edit.jpg',
    '/7. second floor No7/MTS_1671-Edit.jpg',
    '/7. second floor No7/NZ6_4696-2.jpg',
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
    '/10. third floor No10/MTS_1545-HDR-Edit-2.jpg',
    '/10. third floor No10/MTS_1563-Edit.jpg',
    '/10. third floor No10/MTS_1579-HDR-Edit.jpg',
    '/10. third floor No10/MTS_1586-HDR-Edit-2.jpg',
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
