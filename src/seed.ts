import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { connectWithRetry, retryOperation, delay } from './lib/connection-retry';
import { validateConnectionString } from './lib/mongodb-connection';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script');
}

// Configure Prisma client for Turso/libsql
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

type RoomTypeSeed = 'BEDROOM' | 'LIVING_ROOM' | 'STUDIO' | 'OTHER' | 'APARTMENT' | 'KITCHEN' | 'BATHROOM' | 'BALCONY' | 'TERRACE' | 'GARDEN';

type IncantoRoomTemplate = {
  roomNumber: number;
  nameEn: string;
  nameGr: string;
  descriptionEn: string;
  descriptionGr: string;
  type: RoomTypeSeed;
  capacity: number;
  basePrice: number;
  amenities: string[];
};

type IncantoRoomSeed = IncantoRoomTemplate & {
  folderName: string;
  images: string[];
};

const INCANTO_ROOM_TEMPLATES: Record<number, IncantoRoomTemplate> = {
  1: {
    roomNumber: 1,
    nameEn: 'Apartment 1 - Ground Floor',
    nameGr: 'Διαμέρισμα 1 - Ισόγειο',
    descriptionEn: 'Cozy ground floor apartment with modern amenities and comfortable living space.',
    descriptionGr: 'Άνετο διαμέρισμα ισογείου με σύγχρονες παροχές και άνετο χώρο διαβίωσης.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 120,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Balcony']
  },
  2: {
    roomNumber: 2,
    nameEn: 'Apartment 2 - Ground Floor',
    nameGr: 'Διαμέρισμα 2 - Ισόγειο',
    descriptionEn: 'Comfortable ground floor apartment with garden access and modern amenities.',
    descriptionGr: 'Άνετο διαμέρισμα ισογείου με πρόσβαση στον κήπο και σύγχρονες παροχές.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 130,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Garden View']
  },
  3: {
    roomNumber: 3,
    nameEn: 'Apartment 3 - First Floor',
    nameGr: 'Διαμέρισμα 3 - Πρώτος Όροφος',
    descriptionEn: 'Bright first-floor apartment with sea views and modern decor.',
    descriptionGr: 'Φωτεινό διαμέρισμα πρώτου ορόφου με θέα στη θάλασσα και μοντέρνα διακόσμηση.',
    type: 'APARTMENT' as const,
    capacity: 3,
    basePrice: 150,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Sea View']
  },
  4: {
    roomNumber: 4,
    nameEn: 'Apartment 4 - First Floor',
    nameGr: 'Διαμέρισμα 4 - Πρώτος Όροφος',
    descriptionEn: 'Spacious first-floor apartment with stylish decor and premium comfort.',
    descriptionGr: 'Ευρύχωρο διαμέρισμα πρώτου ορόφου με κομψή διακόσμηση και premium άνεση.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 170,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Balcony']
  },
  5: {
    roomNumber: 5,
    nameEn: 'Apartment 5 - First Floor',
    nameGr: 'Διαμέρισμα 5 - Πρώτος Όροφος',
    descriptionEn: 'Spacious apartment with separate living area and panoramic views.',
    descriptionGr: 'Ευρύχωρο διαμέρισμα με ξεχωριστό χώρο καθιστικού και πανοραμική θέα.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 200,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Living Area']
  },
  6: {
    roomNumber: 6,
    nameEn: 'Apartment 6 - Second Floor',
    nameGr: 'Διαμέρισμα 6 - Δεύτερος Όροφος',
    descriptionEn: 'Second-floor apartment with expansive views and contemporary style.',
    descriptionGr: 'Διαμέρισμα δεύτερου ορόφου με εκτεταμένη θέα και σύγχρονο στυλ.',
    type: 'APARTMENT' as const,
    capacity: 3,
    basePrice: 180,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Panoramic View']
  },
  7: {
    roomNumber: 7,
    nameEn: 'Apartment 7 - Second Floor',
    nameGr: 'Διαμέρισμα 7 - Δεύτερος Όροφος',
    descriptionEn: 'Ideal family apartment with generous space and flexible sleeping setup.',
    descriptionGr: 'Ιδανικό οικογενειακό διαμέρισμα με γενναιόδωρο χώρο και ευέλικτη διαμόρφωση ύπνου.',
    type: 'APARTMENT' as const,
    capacity: 5,
    basePrice: 220,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', '2 Bedrooms']
  },
  8: {
    roomNumber: 8,
    nameEn: 'Apartment 8 - Second Floor',
    nameGr: 'Διαμέρισμα 8 - Δεύτερος Όροφος',
    descriptionEn: 'Premium apartment with ocean-facing views and elevated comfort.',
    descriptionGr: 'Premium διαμέρισμα με θέα στον ωκεανό και ανεlevated άνεση.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 240,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Ocean View']
  },
  9: {
    roomNumber: 9,
    nameEn: 'Apartment 9 - Third Floor',
    nameGr: 'Διαμέρισμα 9 - Τρίτος Όροφος',
    descriptionEn: 'Romantic apartment designed for unforgettable stays.',
    descriptionGr: 'Ρομαντικό διαμέρισμα σχεδιασμένο για αξέχαστες διαμονές.',
    type: 'APARTMENT' as const,
    capacity: 2,
    basePrice: 260,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', 'Ocean View']
  },
  10: {
    roomNumber: 10,
    nameEn: 'Apartment 10 - Third Floor',
    nameGr: 'Διαμέρισμα 10 - Τρίτος Όροφος',
    descriptionEn: 'Signature top-floor apartment with the highest level of luxury.',
    descriptionGr: 'Διαμέρισμα τελευταίου ορόφου με το υψηλότερο επίπεδο πολυτέλειας.',
    type: 'APARTMENT' as const,
    capacity: 4,
    basePrice: 300,
    amenities: ['WiFi', 'Free Parking', 'Kitchen', 'Air Conditioning', '2 Bedrooms']
  },
};

function resolveIncantoPublicDir(): string | null {
  const candidates = [
    path.resolve(process.cwd(), '../incanto-hotel/public'),
    path.resolve(process.cwd(), 'incanto-hotel/public'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function createDefaultTemplate(roomNumber: number): IncantoRoomTemplate {
  return {
    roomNumber,
    nameEn: `Incanto Room No${roomNumber}`,
    nameGr: `Incanto Room No${roomNumber}`,
    descriptionEn: `Comfortable accommodation in room No${roomNumber}.`,
    descriptionGr: `Comfortable accommodation in room No${roomNumber}.`,
    type: 'BEDROOM',
    capacity: 2,
    basePrice: 150,
    amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV'],
  };
}

function getRoomImagePaths(publicDir: string, folderName: string): string[] {
  const roomDirPath = path.join(publicDir, folderName);

  return fs
    .readdirSync(roomDirPath, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.(jpe?g|png|webp)$/i.test(entry.name),
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    )
    .map((entry) => `/${folderName}/${entry.name}`.replace(/\\/g, '/'));
}

function buildIncantoRoomSeedsFromPublic(): IncantoRoomSeed[] {
  const publicDir = resolveIncantoPublicDir();
  if (!publicDir) {
    console.warn('⚠️ Incanto public assets folder not found. Seeding fallback room metadata only.');

    return Object.values(INCANTO_ROOM_TEMPLATES).map((template) => ({
      ...template,
      folderName: `${template.roomNumber}. room No${template.roomNumber}`,
      images: [],
    }));
  }

  const roomFolders = fs
    .readdirSync(publicDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(/No(\d+)$/i);
      if (!match) {
        return null;
      }
      return { folderName: entry.name, roomNumber: Number(match[1]) };
    })
    .filter((entry): entry is { folderName: string; roomNumber: number } => entry !== null)
    .sort((a, b) => a.roomNumber - b.roomNumber);

  return roomFolders.map(({ folderName, roomNumber }) => {
    const template = INCANTO_ROOM_TEMPLATES[roomNumber] ?? createDefaultTemplate(roomNumber);
    return {
      ...template,
      folderName,
      images: getRoomImagePaths(publicDir, folderName),
    };
  });
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Diagnose connection string first
  console.log('🔍 Diagnosing connection configuration...');
  const dbUrl = process.env.DATABASE_URL || '';
  const diagnosis = validateConnectionString(dbUrl);
  if (!diagnosis.isValid || diagnosis.issues.length > 0) {
    console.warn('⚠️  Connection string issues detected:');
    diagnosis.issues.forEach(issue => console.warn(`   - ${issue}`));
  }
  if (diagnosis.suggestions.length > 0) {
    console.log('💡 Suggestions:');
    diagnosis.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
  }

  // Test database connection with retry
  await connectWithRetry(prisma);

  // Clear existing data (optional - skip if it fails)
  // Execute sequentially to avoid transaction issues
  console.log('🧹 Cleaning existing data...');
  try {
    // Delete in reverse order of dependencies to avoid foreign key issues
    // Use retry wrapper for each operation
    await retryOperation(() => prisma.propertyAmenity.deleteMany({}), 'Delete propertyAmenity', prisma);
    await delay(200);
    await retryOperation(() => prisma.propertyAvailability.deleteMany({}), 'Delete propertyAvailability', prisma);
    await delay(200);
    await retryOperation(() => prisma.review.deleteMany({}), 'Delete reviews', prisma);
    await delay(200);
    await retryOperation(() => prisma.booking.deleteMany({}), 'Delete bookings', prisma);
    await delay(200);
    await retryOperation(() => prisma.property.deleteMany({}), 'Delete properties', prisma);
    await delay(200);
    await retryOperation(() => prisma.amenity.deleteMany({}), 'Delete amenities', prisma);
    await delay(200);
    await retryOperation(() => prisma.user.deleteMany({}), 'Delete users', prisma);
    await delay(200);
    await retryOperation(() => prisma.service.deleteMany({}), 'Delete services', prisma);
    await delay(200);
    await retryOperation(() => prisma.edition.deleteMany({}), 'Delete editions', prisma);
    await delay(200);
    await retryOperation(() => prisma.knowledgeArticle.deleteMany({}), 'Delete knowledge articles', prisma);
    console.log('✅ Existing data cleaned');
  } catch (error: any) {
    // Connection errors are expected if database is unreachable
    if (error.code === 'P2010' || error.message?.includes('timeout') || error.message?.includes('InternalError')) {
      console.warn('⚠️  Warning: Could not clean existing data due to connection issue (continuing anyway)');
      console.warn('   This might indicate a network/connection problem, but we will try to continue...');
    } else {
      console.warn('⚠️  Warning: Could not clean existing data (continuing anyway):', error.message || error);
      console.warn('   This is okay if the database is empty or if you want to keep existing data');
    }
  }

  // Create amenities
  console.log('📦 Creating amenities...');
  const amenityData = [
    { nameGr: 'WiFi', nameEn: 'WiFi', icon: 'wifi', category: 'essentials' },
    { nameGr: 'Δωρεάν Πάρκινγκ', nameEn: 'Free Parking', icon: 'parking', category: 'parking' },
    { nameGr: 'Πισίνα', nameEn: 'Pool', icon: 'pool', category: 'recreation' },
    { nameGr: 'Γυμναστήριο', nameEn: 'Gym', icon: 'dumbbell', category: 'recreation' },
    { nameGr: 'Δωρεάν Κλιματισμός', nameEn: 'Free Air Conditioning', icon: 'snowflake', category: 'climate' },
    { nameGr: 'Κουζίνα', nameEn: 'Kitchen', icon: 'kitchen', category: 'kitchen' },
    { nameGr: 'Μπαλκόνι', nameEn: 'Balcony', icon: 'balcony', category: 'view' },
    { nameGr: 'Ασανσέρ', nameEn: 'Elevator', icon: 'arrow-up', category: 'accessibility' },
    { nameGr: 'Θέα στη θάλασσα', nameEn: 'Sea View', icon: 'water', category: 'view' },
    { nameGr: 'Πλυντήριο', nameEn: 'Washing Machine', icon: 'washing-machine', category: 'comfort' },
    { nameGr: 'Δωρεάν Τηλεοπτικά Κανάλια', nameEn: 'Free TV Channels', icon: 'tv', category: 'entertainment' },
    { nameGr: 'Προσβάσιμο για ΑΜΕΑ', nameEn: 'Wheelchair Accessible', icon: 'wheelchair', category: 'accessibility' },
    { nameGr: 'Θέρμανση', nameEn: 'Heating', icon: 'thermometer', category: 'comfort' },
    { nameGr: 'Spa', nameEn: 'Spa', icon: 'heart', category: 'wellness' },
    { nameGr: 'Εστιατόριο', nameEn: 'Restaurant', icon: 'utensils', category: 'kitchen' }
  ];

  // Create amenities sequentially to avoid transaction issues
  // MongoDB Atlas M0 doesn't support transactions
  const amenities = [];
  for (let i = 0; i < amenityData.length; i++) {
    try {
      // Check if amenity already exists
      const existing = await retryOperation(
        () => prisma.amenity.findFirst({
          where: { 
            nameEn: amenityData[i].nameEn,
            nameGr: amenityData[i].nameGr
          }
        }),
        `Find amenity ${i + 1}`,
        prisma
      );
      
      if (existing) {
        amenities.push(existing);
        console.log(`   Using existing amenity ${i + 1}/${amenityData.length}: ${amenityData[i].nameEn}`);
      } else {
        const amenity = await retryOperation(
          () => prisma.amenity.create({ data: amenityData[i] }),
          `Create amenity ${i + 1}: ${amenityData[i].nameEn}`,
          prisma
        );
        amenities.push(amenity);
        console.log(`   Created amenity ${i + 1}/${amenityData.length}: ${amenity.nameEn}`);
      }
      await delay(100); // Small delay between operations
    } catch (error: any) {
      console.error(`   Error creating amenity ${i + 1}: ${amenityData[i].nameEn}`, error.message);
      throw error;
    }
  }

  console.log(`✅ Created ${amenities.length} amenities`);

  // Create users
  console.log('👥 Creating users...');
  
  // Check if admin users already exist to preserve their credentials
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@realestate.com' }
  });
  
  const existingStefadmin = await prisma.user.findUnique({
    where: { email: 'Stefadmin@stefanos.com' }
  });

  // Create or update admin user (preserve password if exists)
  const adminPassword = await hashPassword('admin123');
  const admin = existingAdmin 
    ? await prisma.user.update({
        where: { email: 'admin@realestate.com' },
        data: {
          name: 'Admin User',
          phone: '+30 210 123 4567',
          role: 'ADMIN',
          isActive: true,
          avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=d4af37&color=000'
          // Don't update password to preserve existing login
        }
      })
    : await prisma.user.create({
        data: {
          email: 'admin@realestate.com',
          name: 'Admin User',
          phone: '+30 210 123 4567',
          password: adminPassword,
          role: 'ADMIN',
          isActive: true,
          avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=d4af37&color=000'
        }
      });

  // Create or update Stefadmin user for admin panel (CRITICAL: preserve credentials)
  const stefadminPassword = await hashPassword('stef159');
  const stefadmin = existingStefadmin
    ? await prisma.user.update({
        where: { email: 'Stefadmin@stefanos.com' },
        data: {
          name: 'Stefadmin',
          phone: '+30 210 123 4568',
          role: 'ADMIN',
          isActive: true,
          avatar: 'https://ui-avatars.com/api/?name=Stefadmin&background=3b82f6&color=fff'
          // Don't update password to preserve admin panel login credentials
        }
      })
    : await prisma.user.create({
        data: {
          email: 'Stefadmin@stefanos.com',
          name: 'Stefadmin',
          phone: '+30 210 123 4568',
          password: stefadminPassword, // Username: Stefadmin, Password: stef159
          role: 'ADMIN',
          isActive: true,
          avatar: 'https://ui-avatars.com/api/?name=Stefadmin&background=3b82f6&color=fff'
        }
      });

  const ownerData = [
    { email: 'owner1@realestate.com', name: 'SMH', phone: '+30 210 987 6543', password: 'owner123', avatar: 'https://ui-avatars.com/api/?name=SMH&background=d4af37&color=000' },
    { email: 'owner2@realestate.com', name: 'Maria Papadopoulou', phone: '+30 231 123 4567', password: 'owner123', avatar: 'https://ui-avatars.com/api/?name=Maria+Papadopoulou&background=d4af37&color=000' },
    { email: 'owner3@realestate.com', name: 'Dimitris Georgiou', phone: '+30 228 765 4321', password: 'owner123', avatar: 'https://ui-avatars.com/api/?name=Dimitris+Georgiou&background=d4af37&color=000' }
  ];

  const owners = [];
  for (const data of ownerData) {
    const owner = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: await hashPassword(data.password),
        role: 'PROPERTY_OWNER',
        isActive: true,
        avatar: data.avatar
      }
    });
    owners.push(owner);
  }

  const guestData = [
    { email: 'guest1@example.com', name: 'John Smith', phone: '+1 555 123 4567', password: 'guest123', avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=3b82f6&color=fff' },
    { email: 'guest2@example.com', name: 'Emma Johnson', phone: '+44 20 1234 5678', password: 'guest123', avatar: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=10b981&color=fff' },
    { email: 'guest3@example.com', name: 'Michael Brown', phone: '+49 30 12345678', password: 'guest123', avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=f59e0b&color=fff' }
  ];

  const guests = [];
  for (const data of guestData) {
    const guest = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: await hashPassword(data.password),
        role: 'USER',
        isActive: true,
        avatar: data.avatar
      }
    });
    guests.push(guest);
  }

  console.log(`✅ Created ${1 + owners.length + guests.length} users`);

  // Create properties
  console.log('🏠 Creating properties...');
  const propertyData = [
    // Incanto Apartments - Preveza ONLY
    {
      titleGr: 'L\'Incanto Apartments',
      titleEn: 'L\'Incanto Apartments',
      descriptionGr: 'Αποκλειστικά συγκροτήματα διαμερισμάτων στην Πρέβεζα με πανοραμική θέα στο Ιόνιο Πέλαγος. Πολυτελείς διαμονή με εξαιρετικές παροχές.',
      descriptionEn: 'Exclusive apartment complexes in Preveza with panoramic views of the Ionian Sea. Luxury accommodation with excellent amenities.',
      type: 'APARTMENT' as const,
      address: 'Ionian Coast',
      city: 'Preveza',
      country: 'Greece',
      latitude: 38.9565,
      longitude: 20.7519,
      maxGuests: 4,
      bedrooms: 1,
      bathrooms: 1,
      area: 45.0,
      basePrice: 150,
      cleaningFee: 50,
      serviceFeePercentage: 10,
      taxes: 24,
      minStay: 1,
      maxStay: 30,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'MODERATE' as const,
      houseRules: 'No smoking, no parties, quiet hours after 11 PM',
      petFriendly: false,
      smokingAllowed: false,
      partyAllowed: false,
      images: [
        'http://licanto.vercel.app/images/apartment1.jpg',
        'http://licanto.vercel.app/images/apartment2.jpg',
        'http://licanto.vercel.app/images/apartment3.jpg'
      ],
      ownerId: owners[0].id,
      amenityIds: [0, 1, 10, 5] // wifi (0), free parking (1), free tv channels (10), free air conditioning (5)
    }
  ];

  // Create properties sequentially, then link amenities separately
  // This avoids transaction issues with MongoDB Atlas M0
  const properties = [];
  for (let i = 0; i < propertyData.length; i++) {
    const prop = propertyData[i];
    const { amenityIds, serviceFeePercentage, ownerId, ...propertyInfo } = prop;
    
    try {
      // Create property first (without nested creates to avoid transactions)
      // Use owner relation (connect) to satisfy Prisma's PropertyCreateInput XOR
      const property = await retryOperation(
        () => prisma.property.create({ 
          data: {
            ...propertyInfo,
            owner: { connect: { id: String(ownerId) } }
          } 
        }),
        `Create property ${i + 1}: ${propertyInfo.titleEn}`,
        prisma
      );
      properties.push(property);
      
      // Then create amenity links separately
      if (amenityIds && amenityIds.length > 0) {
        for (const amenityIndex of amenityIds) {
          try {
            await retryOperation(
              () => prisma.propertyAmenity.create({
                data: {
                  propertyId: property.id,
                  amenityId: amenities[amenityIndex].id
                }
              }),
              `Link amenity ${amenityIndex} to property ${i + 1}`,
              prisma
            );
            await delay(50); // Small delay between amenity links
          } catch (error: any) {
            // Ignore duplicate errors (unique constraint)
            if (error.code !== 'P2002') {
              console.warn(`   Warning: Could not link amenity ${amenityIndex} to property ${i + 1}`);
            }
          }
        }
      }
      
      console.log(`   Created property ${i + 1}/${propertyData.length}: ${property.titleEn}`);
      await delay(200); // Delay between properties
    } catch (error: any) {
      console.error(`   Error creating property ${i + 1}: ${propertyInfo.titleEn}`, error.message);
      throw error;
    }
  }

  console.log(`✅ Created ${properties.length} properties`);

  // Create Incanto rooms from real media folders in incanto-hotel/public
  console.log('Creating Incanto rooms from public assets...');
  const seededRooms = [];
  const incantoProperty = properties.find((property) => property.titleEn === "L'Incanto Apartments");

  if (incantoProperty) {
    const roomSeeds = buildIncantoRoomSeedsFromPublic();
    roomSeeds.sort((a, b) => a.roomNumber - b.roomNumber);

    for (const roomSeed of roomSeeds) {
      try {
        const room = await retryOperation(
          () =>
            prisma.room.create({
              data: {
                propertyId: incantoProperty.id,
                ownerId: incantoProperty.ownerId,
                name: roomSeed.nameEn,
                nameEn: roomSeed.nameEn,
                nameGr: roomSeed.nameGr,
                type: roomSeed.type,
                capacity: roomSeed.capacity,
                basePrice: roomSeed.basePrice,
                isBookable: true,
                amenities: roomSeed.amenities,
                images: roomSeed.images,
                descriptionEn: roomSeed.descriptionEn,
                descriptionGr: roomSeed.descriptionGr,
              },
            }),
          'Create Incanto room No' + roomSeed.roomNumber,
          prisma,
        );

        seededRooms.push(room);
        console.log(
          '   Created room No' + roomSeed.roomNumber + ': ' + (room.nameEn || room.name) + ' (' + roomSeed.images.length + ' images)',
        );
        await delay(75);
      } catch (error: any) {
        console.error('   Error creating Incanto room No' + roomSeed.roomNumber + ': ' + error.message);
        throw error;
      }
    }

    await prisma.property.update({
      where: { id: incantoProperty.id },
      data: { hasDynamicRooms: seededRooms.length > 0 },
    });

    console.log('Created ' + seededRooms.length + ' Incanto rooms');
  } else {
    console.warn('Incanto property not found, skipping room seeding');
  }

  // Create property availability (next 90 days)
  console.log('📅 Creating property availability...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const property of properties) {
    const availabilityDates = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Randomly make some dates unavailable (10% chance)
      const available = Math.random() > 0.1;
      
      availabilityDates.push({
        propertyId: property.id,
        date: date,
        available: available,
        price: available ? property.basePrice * (0.9 + Math.random() * 0.2) : null, // ±10% price variation
        minStay: property.minStay
      });
    }
    
    await prisma.propertyAvailability.createMany({
      data: availabilityDates
    });
  }

  console.log('✅ Created property availability for next 90 days');

  // Create bookings
  console.log('📋 Creating bookings...');
  const bookings = [];
  for (let i = 0; i < 8; i++) {
    const property = properties[Math.floor(Math.random() * properties.length)];
    const guest = guests[Math.floor(Math.random() * guests.length)];
    
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkIn.getDate() + Math.floor(Math.random() * 7) + 1);
    
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = property.basePrice * nights;
    const cleaningFee = property.cleaningFee || 0;
    const serviceFee = basePrice * (property.serviceFeePercentage || 10) / 100;
    const taxes = property.taxes || 0;
    const totalPrice = basePrice + cleaningFee + serviceFee + taxes;
    
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
    const paymentStatuses = ['PENDING', 'COMPLETED', 'REFUNDED'] as const;
    
    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: Math.min(Math.floor(Math.random() * property.maxGuests) + 1, property.maxGuests),
        totalPrice: totalPrice,
        basePrice: basePrice,
        cleaningFee: cleaningFee,
        serviceFee: serviceFee,
        taxes: taxes,
        currency: 'EUR',
        guestName: guest.name || 'Guest',
        guestEmail: guest.email,
        guestPhone: guest.phone || '+30 210 000 0000',
        specialRequests: Math.random() > 0.7 ? 'Late check-in requested' : null
      }
    });
    bookings.push(booking);
  }

  console.log(`✅ Created ${bookings.length} bookings`);

  // Create reviews
  console.log('⭐ Creating reviews...');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  
  // More realistic review data with specific details about Incanto Apartments
  const reviewTemplates = [
    {
      titles: ['Absolutely Perfect Stay!', 'Amazing Incanto Experience', 'Beyond Expectations', 'Wonderful Apartment'],
      comments: [
        'L\'Incanto Apartments exceeded all our expectations. The apartment was spotlessly clean, beautifully decorated, and had everything we needed for a perfect stay in Preveza. The sea views were breathtaking!',
        'Perfect location in Preveza with stunning Ionian Sea views. The apartment was modern, well-equipped, and the host was incredibly responsive. Would definitely stay here again!',
        'We had an amazing time at L\'Incanto. The property was exactly as described - clean, comfortable, and with premium amenities. The balcony views of the sea were spectacular!',
        'Beautiful apartment complex with excellent facilities. Our room was spacious, the kitchen was fully equipped, and the location was perfect for exploring Preveza. Highly recommended!'
      ],
      ratings: [5, 5, 4, 5]
    },
    {
      titles: ['Great Value for Money', 'Comfortable and Clean', 'Good Location', 'Pleasant Stay'],
      comments: [
        'Very comfortable apartment with all necessary amenities. Good value for the price and located in a quiet area of Preveza. Would recommend for families.',
        'Clean and well-maintained property. The apartment had everything we needed for our stay. The host was helpful and check-in was smooth.',
        'Nice apartment complex with good facilities. The room was comfortable and the location was convenient for visiting local attractions in Preveza.',
        'Pleasant stay at L\'Incanto Apartments. The property was clean and well-equipped. Good value for money and the staff were friendly.'
      ],
      ratings: [4, 4, 4, 3]
    },
    {
      titles: ['Luxury Experience', 'Premium Stay', 'Five Star Service', 'Exceptional'],
      comments: [
        'This is a premium property that delivers on luxury. From the high-end appliances to the comfortable beds, everything was top quality. The sea views from our apartment were absolutely stunning.',
        'Exceptional experience at L\'Incanto. The apartment was spacious, elegantly furnished, and had premium amenities throughout. The host attention to detail was impressive.',
        'Five-star stay in every aspect. The property was immaculate, the facilities were excellent, and the location in Preveza was perfect. Worth every penny!',
        'Luxury accommodation with spectacular views. The apartment was beautifully designed and had everything we needed for a comfortable stay. Highly recommend for a special occasion.'
      ],
      ratings: [5, 5, 5, 5]
    }
  ];

  let reviewCount = 0;
  for (const booking of completedBookings) {
    const property = properties.find(p => p.id === booking.propertyId);
    if (!property) continue;

    // Select a random template based on property type and create realistic review
    const templateIndex = property.titleEn.includes("Incanto") ? 
      Math.floor(Math.random() * reviewTemplates.length) : 0;
    const template = reviewTemplates[templateIndex];
    
    const titleIndex = Math.floor(Math.random() * template.titles.length);
    const commentIndex = Math.floor(Math.random() * template.comments.length);
    const ratingIndex = Math.floor(Math.random() * template.ratings.length);

    await prisma.review.create({
      data: {
        propertyId: booking.propertyId,
        bookingId: booking.id,
        guestId: booking.guestId,
        rating: template.ratings[ratingIndex],
        cleanlinessRating: Math.min(5, template.ratings[ratingIndex] + Math.floor(Math.random() * 2) - 1),
        accuracyRating: Math.min(5, template.ratings[ratingIndex] + Math.floor(Math.random() * 2) - 1),
        communicationRating: Math.min(5, template.ratings[ratingIndex] + Math.floor(Math.random() * 2) - 1),
        locationRating: Math.min(5, template.ratings[ratingIndex] + Math.floor(Math.random() * 2) - 1),
        valueRating: Math.min(5, template.ratings[ratingIndex] + Math.floor(Math.random() * 2) - 1),
        title: template.titles[titleIndex],
        comment: template.comments[commentIndex],
        isPublic: true,
        createdAt: new Date(booking.checkOut.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Review created 0-7 days after checkout
      }
    });
    reviewCount++;
  }

  console.log(`✅ Created ${reviewCount} realistic reviews`);

  // Create services
  console.log('🛠️ Creating services...');
  const serviceData = [
    {
      titleGr: 'Διαχείριση Ακινήτων',
      titleEn: 'Property Management',
      descriptionGr: 'Αξιόπιστη διαχείριση των ακινήτων σας',
      descriptionEn: 'Reliable management of your properties',
      icon: 'building',
      features: ['24/7 Support', 'Maintenance', 'Tenant Screening', 'Financial Reports'],
      pricingGr: 'Από 200€/μήνα',
      pricingEn: 'From €200/month',
      isActive: true
    },
    {
      titleGr: 'Πλατφόρμα Κρατήσεων',
      titleEn: 'Booking Platform',
      descriptionGr: 'Σύγχρονη πλατφόρμα για κρατήσεις',
      descriptionEn: 'Modern platform for bookings',
      icon: 'calendar',
      features: ['Online Booking', 'Payment Processing', 'Calendar Sync', 'Guest Communication'],
      pricingGr: '3% ανά κράτηση',
      pricingEn: '3% per booking',
      isActive: true
    },
    {
      titleGr: 'Ανάλυση Αγοράς',
      titleEn: 'Market Analysis',
      descriptionGr: 'Συμβουλές για την αγορά ακινήτων',
      descriptionEn: 'Advice for real estate investment',
      icon: 'chart-line',
      features: ['Market Trends', 'Price Analysis', 'Investment Opportunities', 'Risk Assessment'],
      pricingGr: 'Από 500€',
      pricingEn: 'From €500',
      isActive: true
    },
    {
      titleGr: 'Μάρκετινγκ & Προώθηση',
      titleEn: 'Marketing & Promotion',
      descriptionGr: 'Επαγγελματική προώθηση των ακινήτων σας',
      descriptionEn: 'Professional promotion of your properties',
      icon: 'megaphone',
      features: ['Social Media', 'SEO Optimization', 'Professional Photography', 'Virtual Tours'],
      pricingGr: 'Από 300€/μήνα',
      pricingEn: 'From €300/month',
      isActive: true
    }
  ];

  const services = [];
  for (const data of serviceData) {
    const service = await prisma.service.create({ data });
    services.push(service);
  }

  console.log(`✅ Created ${services.length} services`);

  // Create editions
  console.log('📚 Creating editions...');
  const editionData = [
    // Properties category
    {
      category: 'properties',
      titleGr: 'Ακίνητα',
      titleEn: 'Properties',
      descriptionGr: 'Εκδόσεις ακινήτων για κάθε ανάγκη',
      descriptionEn: 'Property editions for every need',
      contentGr: 'Ανακαλύψτε τα καλύτερα ακίνητα',
      contentEn: 'Discover the best properties',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 1,
      icon: 'https://placehold.co/80x80/3b82f6/FFFFFF?text=Properties',
      color: 'blue'
    },
    {
      category: 'properties',
      titleGr: 'Κατοικίες',
      titleEn: 'Residential Properties',
      descriptionGr: 'Σύγχρονα διαμερίσματα και σπίτια',
      descriptionEn: 'Modern apartments and houses',
      contentGr: 'Ανακαλύψτε τα καλύτερα ακίνητα για κατοικία',
      contentEn: 'Discover the best properties for living',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 2
    },
    {
      category: 'properties',
      titleGr: 'Επαγγελματικά',
      titleEn: 'Commercial Properties',
      descriptionGr: 'Γραφεία και εμπορικούς χώρους',
      descriptionEn: 'Offices and commercial spaces',
      contentGr: 'Ιδανικά ακίνητα για την επιχείρησή σας',
      contentEn: 'Perfect properties for your business',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 3
    },
    {
      category: 'properties',
      titleGr: 'Επαγγελματικά Ακίνητα',
      titleEn: 'Business Properties',
      descriptionGr: 'Ακίνητα για επαγγελματική χρήση',
      descriptionEn: 'Properties for business use',
      contentGr: 'Βρείτε το ιδανικό επαγγελματικό χώρο',
      contentEn: 'Find the perfect business space',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 4
    },
    {
      category: 'properties',
      titleGr: 'Ενοικίαση',
      titleEn: 'Rental Properties',
      descriptionGr: 'Ακίνητα προς ενοικίαση',
      descriptionEn: 'Properties for rent',
      contentGr: 'Βρείτε το ιδανικό ακίνητο για ενοικίαση',
      contentEn: 'Find the perfect property for rent',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 5
    },
    // Booking category
    {
      category: 'booking',
      titleGr: 'Κρατήσεις',
      titleEn: 'Booking Services',
      descriptionGr: 'Εκδόσεις υπηρεσιών κρατήσεων',
      descriptionEn: 'Booking service editions',
      contentGr: 'Σύγχρονη πλατφόρμα κρατήσεων',
      contentEn: 'Modern booking platform',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 1,
      icon: 'https://placehold.co/80x80/10b981/FFFFFF?text=Booking',
      color: 'green'
    },
    {
      category: 'booking',
      titleGr: 'Βραχυχρόνιες Κρατήσεις',
      titleEn: 'Short-term Rentals',
      descriptionGr: 'Κρατήσεις για διακοπές και ταξίδια',
      descriptionEn: 'Bookings for vacations and travel',
      contentGr: 'Βρείτε το ιδανικό μέρος για τις διακοπές σας',
      contentEn: 'Find the perfect place for your vacation',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 2
    },
    {
      category: 'booking',
      titleGr: 'Μακροχρόνιες Κρατήσεις',
      titleEn: 'Long-term Rentals',
      descriptionGr: 'Κρατήσεις για μακροχρόνια διαμονή',
      descriptionEn: 'Bookings for long-term stays',
      contentGr: 'Βρείτε μακροχρόνια διαμονή',
      contentEn: 'Find long-term accommodation',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 3
    },
    {
      category: 'booking',
      titleGr: 'Διαχείριση Κρατήσεων',
      titleEn: 'Booking Management',
      descriptionGr: 'Εργαλεία διαχείρισης κρατήσεων',
      descriptionEn: 'Booking management tools',
      contentGr: 'Διαχειριστείτε τις κρατήσεις σας',
      contentEn: 'Manage your bookings',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 4
    },
    {
      category: 'booking',
      titleGr: 'Πληρωμές',
      titleEn: 'Payments',
      descriptionGr: 'Σύστημα πληρωμών για κρατήσεις',
      descriptionEn: 'Payment system for bookings',
      contentGr: 'Ασφαλείς πληρωμές',
      contentEn: 'Secure payments',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 5
    },
    // Airbnb category
    {
      category: 'airbnb',
      titleGr: 'Airbnb',
      titleEn: 'Airbnb Integration',
      descriptionGr: 'Εκδόσεις Airbnb integration',
      descriptionEn: 'Airbnb integration editions',
      contentGr: 'Ολοκληρωμένη ενσωμάτωση με Airbnb',
      contentEn: 'Complete integration with Airbnb',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 1,
      icon: 'https://placehold.co/80x80/8b5cf6/FFFFFF?text=Airbnb',
      color: 'purple'
    },
    {
      category: 'airbnb',
      titleGr: 'Συγχρονισμός Airbnb',
      titleEn: 'Airbnb Sync',
      descriptionGr: 'Αυτόματος συγχρονισμός με Airbnb',
      descriptionEn: 'Automatic sync with Airbnb',
      contentGr: 'Συγχρονίστε τις κρατήσεις σας',
      contentEn: 'Sync your bookings',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 2
    },
    {
      category: 'airbnb',
      titleGr: 'Διαχείριση Airbnb',
      titleEn: 'Airbnb Management',
      descriptionGr: 'Διαχείριση Airbnb listings',
      descriptionEn: 'Manage Airbnb listings',
      contentGr: 'Διαχειριστείτε τα listings σας',
      contentEn: 'Manage your listings',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 3
    },
    // Knowledge category
    {
      category: 'knowledge',
      titleGr: 'Γνώση',
      titleEn: 'Knowledge & Services',
      descriptionGr: 'Εκδόσεις γνώσης και υπηρεσιών',
      descriptionEn: 'Knowledge and service editions',
      contentGr: 'Βάση γνώσης και οδηγοί',
      contentEn: 'Knowledge base and guides',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 1,
      icon: 'https://placehold.co/80x80/f59e0b/FFFFFF?text=Knowledge',
      color: 'orange'
    },
    {
      category: 'knowledge',
      titleGr: 'Οδηγοί',
      titleEn: 'Guides',
      descriptionGr: 'Οδηγοί και tutorials',
      descriptionEn: 'Guides and tutorials',
      contentGr: 'Μάθετε πώς να χρησιμοποιήσετε την πλατφόρμα',
      contentEn: 'Learn how to use the platform',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 2
    },
    {
      category: 'knowledge',
      titleGr: 'FAQ',
      titleEn: 'FAQ',
      descriptionGr: 'Συχνές ερωτήσεις',
      descriptionEn: 'Frequently asked questions',
      contentGr: 'Βρείτε απαντήσεις στις ερωτήσεις σας',
      contentEn: 'Find answers to your questions',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 3
    },
    {
      category: 'knowledge',
      titleGr: 'Υποστήριξη',
      titleEn: 'Support',
      descriptionGr: 'Υποστήριξη χρηστών',
      descriptionEn: 'User support',
      contentGr: 'Λάβετε βοήθεια',
      contentEn: 'Get help',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 4
    },
    // Admin category
    {
      category: 'admin',
      titleGr: 'Διαχείριση',
      titleEn: 'Admin & Management',
      descriptionGr: 'Εκδόσεις διαχείρισης',
      descriptionEn: 'Management editions',
      contentGr: 'Εργαλεία διαχείρισης',
      contentEn: 'Management tools',
      status: 'PUBLISHED' as const,
      featured: true,
      order: 1,
      icon: 'https://placehold.co/80x80/6b7280/FFFFFF?text=Admin',
      color: 'gray'
    },
    {
      category: 'admin',
      titleGr: 'Διαχείριση Χρηστών',
      titleEn: 'User Management',
      descriptionGr: 'Διαχείριση χρηστών',
      descriptionEn: 'User management',
      contentGr: 'Διαχειριστείτε τους χρήστες',
      contentEn: 'Manage users',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 2
    },
    {
      category: 'admin',
      titleGr: 'Αναφορές',
      titleEn: 'Reports',
      descriptionGr: 'Αναφορές και στατιστικά',
      descriptionEn: 'Reports and statistics',
      contentGr: 'Δείτε αναφορές και στατιστικά',
      contentEn: 'View reports and statistics',
      status: 'PUBLISHED' as const,
      featured: false,
      order: 3
    }
  ];

  const editions = [];
  for (const data of editionData) {
    const edition = await prisma.edition.create({ data });
    editions.push(edition);
  }

  console.log(`✅ Created ${editions.length} editions`);

  // Create knowledge articles
  console.log('📖 Creating knowledge articles...');
  const knowledgeArticleData = [
    {
      titleGr: 'Οδηγός Επένδυσης σε Ακίνητα',
      titleEn: 'Real Estate Investment Guide',
      contentGr: 'Όλα όσα χρειάζεται να ξέρετε για την επένδυση σε ακίνητα. Από την ανάλυση της αγοράς έως τη διαχείριση του ακινήτου.',
      contentEn: 'Everything you need to know about real estate investment. From market analysis to property management.',
      category: 'investment',
      tags: ['investment', 'real-estate', 'guide'],
      author: 'Real Estate Team',
      readTime: 15,
      publishedAt: new Date()
    },
    {
      titleGr: 'Νομικές Υποχρεώσεις',
      titleEn: 'Legal Requirements',
      contentGr: 'Οι νομικές υποχρεώσεις για ιδιοκτήτες ακινήτων. Συμβάσεις, φόροι, και άδειες.',
      contentEn: 'Legal requirements for property owners. Contracts, taxes, and permits.',
      category: 'legal',
      tags: ['legal', 'requirements', 'property-owners'],
      author: 'Legal Team',
      readTime: 10,
      publishedAt: new Date()
    },
    {
      titleGr: 'Συμβουλές για Ενοικιαστές',
      titleEn: 'Tips for Renters',
      contentGr: 'Πώς να βρείτε το ιδανικό ακίνητο για ενοικίαση. Συμβουλές και κόλπα.',
      contentEn: 'How to find the perfect property for rent. Tips and tricks.',
      category: 'renting',
      tags: ['renting', 'tips', 'guide'],
      author: 'Rental Team',
      readTime: 8,
      publishedAt: new Date()
    }
  ];

  const knowledgeArticles = [];
  for (const data of knowledgeArticleData) {
    const article = await prisma.knowledgeArticle.create({ data });
    knowledgeArticles.push(article);
  }

  console.log(`✅ Created ${knowledgeArticles.length} knowledge articles`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${amenities.length} amenities`);
  console.log(`   - ${1 + owners.length + guests.length} users (1 admin, ${owners.length} owners, ${guests.length} guests)`);
  console.log(`   - ${properties.length} properties`);
  console.log(`   - ${seededRooms.length} Incanto rooms`);
  console.log(`   - ${bookings.length} bookings`);
  console.log(`   - ${completedBookings.length} reviews`);
  console.log(`   - ${services.length} services`);
  console.log(`   - ${editions.length} editions`);
  console.log(`   - ${knowledgeArticles.length} knowledge articles`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: admin@realestate.com / admin123');
  console.log('   Stefadmin (Admin Panel): Stefadmin / stef159');
  console.log('   Owner: owner1@realestate.com / owner123');
  console.log('   Guest: guest1@example.com / guest123');
}

main()
  .catch((e: any) => {
    console.error('\n❌ Error during seed:', e);
    
    if (e.code === 'P2010') {
      if (e.message?.includes('Transactions are not supported')) {
        console.error('\n💡 Transaction Error: MongoDB Atlas M0 (free tier) does not support transactions.');
        console.error('   The seed script has been updated to avoid transactions, but if you see this error:');
        console.error('   1. Ensure your DATABASE_URL is a MongoDB connection string (not PostgreSQL)');
        console.error('   2. Check that you are using MongoDB Atlas M0 or higher');
        console.error('   3. Try upgrading to a MongoDB Atlas cluster that supports transactions (M10+)');
        console.error('   4. Or ensure the seed script operations are truly sequential');
      } else if (e.message?.includes('Server selection timeout') || e.message?.includes('InternalError') || e.message?.includes('fatal alert')) {
        console.error('\n💡 Connection/SSL Error: This is a network or SSL/TLS handshake issue.');
        console.error('\n   The error "fatal alert: InternalError" typically means:');
        console.error('   1. MongoDB Atlas cluster is PAUSED (most common issue)');
        console.error('      → Go to MongoDB Atlas → Clusters → Resume your cluster');
        console.error('   2. IP address is not whitelisted');
        console.error('      → Go to MongoDB Atlas → Network Access → Add IP Address');
        console.error('      → For testing: Add 0.0.0.0/0 (allows all IPs - not for production)');
        console.error('   3. Firewall or network blocking SSL/TLS connections');
        console.error('      → Check your firewall/antivirus settings');
        console.error('      → Try from a different network (mobile hotspot)');
        console.error('   4. Connection string format issue');
        console.error('      → Ensure it starts with mongodb+srv://');
        console.error('      → Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
        console.error('\n   Quick fixes to try:');
        console.error('   1. Check MongoDB Atlas dashboard - is your cluster running?');
        console.error('   2. In MongoDB Atlas → Network Access, add your current IP or 0.0.0.0/0');
        console.error('   3. Verify your DATABASE_URL in .env file is correct');
        console.error('   4. Try pinging your cluster: Check cluster status in Atlas dashboard');
        
        // Show current connection string (masked)
        const dbUrl = process.env.DATABASE_URL || '';
        if (dbUrl) {
          const masked = dbUrl.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1***:***@');
          console.error(`\n   Current DATABASE_URL format: ${masked.substring(0, 80)}...`);
        }
      } else {
        console.error('\n💡 Database Error (P2010):', e.message);
        console.error('   This is a Prisma database connection error.');
        console.error('   Check your DATABASE_URL and MongoDB Atlas configuration.');
      }
    } else if (e.message?.includes('timeout') || e.message?.includes('ECONNREFUSED')) {
      console.error('\n💡 Network Error: Cannot connect to MongoDB.');
      console.error('   Please verify your DATABASE_URL and network connectivity.');
    } else {
      console.error('\n💡 Unexpected error occurred during seeding.');
      console.error('   Error details:', e.message || e);
    }
    
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  });
