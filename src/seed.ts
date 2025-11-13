import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { 
  normalizeMongoConnectionString, 
  validateConnectionString,
  getNormalizedConnectionString 
} from './lib/mongodb-connection';
import { 
  connectWithRetry, 
  retryOperation, 
  delay 
} from './lib/connection-retry';

// Load environment variables
dotenv.config();

// Normalize connection string before Prisma initialization
// This ensures proper SSL/TLS configuration for MongoDB Atlas
try {
  const normalizedUrl = getNormalizedConnectionString();
  process.env.DATABASE_URL = normalizedUrl;
  console.log('🔧 Normalized MongoDB connection string with SSL/TLS parameters');
} catch (error: any) {
  console.error('❌ Failed to normalize connection string:', error.message);
  throw error;
}

// Configure Prisma client for MongoDB without transactions
// MongoDB Atlas M0 (free tier) doesn't support transactions
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
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
    { nameGr: 'WiFi', nameEn: 'WiFi', icon: 'wifi', category: 'internet' },
    { nameGr: 'Πάρκινγκ', nameEn: 'Parking', icon: 'car', category: 'transportation' },
    { nameGr: 'Πισίνα', nameEn: 'Pool', icon: 'swimming-pool', category: 'recreation' },
    { nameGr: 'Γυμναστήριο', nameEn: 'Gym', icon: 'dumbbell', category: 'recreation' },
    { nameGr: 'Κλιματισμός', nameEn: 'Air Conditioning', icon: 'snowflake', category: 'comfort' },
    { nameGr: 'Κουζίνα', nameEn: 'Kitchen', icon: 'utensils', category: 'comfort' },
    { nameGr: 'Μπαλκόνι', nameEn: 'Balcony', icon: 'home', category: 'outdoor' },
    { nameGr: 'Ασανσέρ', nameEn: 'Elevator', icon: 'arrow-up', category: 'accessibility' },
    { nameGr: 'Θέα στη θάλασσα', nameEn: 'Sea View', icon: 'water', category: 'view' },
    { nameGr: 'Πλυντήριο', nameEn: 'Washing Machine', icon: 'washing-machine', category: 'comfort' },
    { nameGr: 'Τηλεόραση', nameEn: 'TV', icon: 'tv', category: 'entertainment' },
    { nameGr: 'Προσβάσιμο για ΑΜΕΑ', nameEn: 'Wheelchair Accessible', icon: 'wheelchair', category: 'accessibility' }
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
    { email: 'owner1@realestate.com', name: 'Stefanos Spyros', phone: '+30 210 987 6543', password: 'owner123', avatar: 'https://ui-avatars.com/api/?name=Stefanos+Spyros&background=d4af37&color=000' },
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
    // Athens Properties
    {
      titleGr: 'Μοντέρνο Διαμέρισμα στο Κέντρο της Αθήνας',
      titleEn: 'Modern Apartment in Athens Center',
      descriptionGr: 'Άνετο και φωτεινό διαμέρισμα 2 υπνοδωματίων στο ιστορικό κέντρο της Αθήνας, κοντά στο Σύνταγμα.',
      descriptionEn: 'Comfortable and bright 2-bedroom apartment in the historic center of Athens, near Syntagma Square.',
      type: 'APARTMENT' as const,
      address: 'Ermou Street 45',
      city: 'Athens',
      country: 'Greece',
      latitude: 37.9755,
      longitude: 23.7348,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      area: 75.5,
      basePrice: 120,
      cleaningFee: 25,
      serviceFee: 15,
      taxes: 8,
      minStay: 2,
      maxStay: 30,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: 'FLEXIBLE' as const,
      houseRules: 'No smoking, no parties, pets allowed',
      petFriendly: true,
      smokingAllowed: false,
      partyAllowed: false,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ],
      ownerId: owners[0].id,
      amenityIds: [0, 2, 4, 5, 6, 7, 10] // wifi, ac, kitchen, balcony, elevator, washing machine, tv
    },
    {
      titleGr: 'Πολυτελές Studio με Θέα στην Ακρόπολη',
      titleEn: 'Luxury Studio with Acropolis View',
      descriptionGr: 'Εξαιρετικό studio με πανοραμική θέα στην Ακρόπολη, ιδανικό για ζευγάρια.',
      descriptionEn: 'Excellent studio with panoramic view of the Acropolis, perfect for couples.',
      type: 'ROOM' as const,
      address: 'Plaka District, Adrianou Street 12',
      city: 'Athens',
      country: 'Greece',
      latitude: 37.9715,
      longitude: 23.7268,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      area: 45.0,
      basePrice: 95,
      cleaningFee: 20,
      serviceFee: 12,
      taxes: 6,
      minStay: 1,
      maxStay: 14,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
      ],
      ownerId: owners[0].id,
      amenityIds: [0, 4, 5, 6, 8, 10] // wifi, ac, kitchen, balcony, sea view, tv
    },
    {
      titleGr: 'Σπίτι 3 Υπνοδωματίων στο Κουκάκι',
      titleEn: '3-Bedroom House in Koukaki',
      descriptionGr: 'Άνετο σπίτι 3 υπνοδωματίων στην περιοχή Κουκάκι, κοντά στα μουσεία.',
      descriptionEn: 'Comfortable 3-bedroom house in Koukaki area, near museums.',
      type: 'HOUSE' as const,
      address: 'Veikou Street 78',
      city: 'Athens',
      country: 'Greece',
      latitude: 37.9680,
      longitude: 23.7280,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      area: 120.0,
      basePrice: 180,
      cleaningFee: 35,
      serviceFee: 20,
      taxes: 12,
      minStay: 3,
      maxStay: 30,
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
      ],
      ownerId: owners[0].id,
      amenityIds: [0, 1, 4, 5, 6, 7, 9, 10] // wifi, parking, ac, kitchen, balcony, elevator, washing machine, tv
    },
    // Mykonos Properties
    {
      titleGr: 'Βίλα με Πισίνα στη Μύκονο',
      titleEn: 'Villa with Pool in Mykonos',
      descriptionGr: 'Απίστευτη βίλα 4 υπνοδωματίων με ιδιωτική πισίνα και θέα στη θάλασσα.',
      descriptionEn: 'Incredible 4-bedroom villa with private pool and sea view.',
      type: 'VACATION_RENTAL' as const,
      address: 'Paradise Beach Road',
      city: 'Mykonos',
      country: 'Greece',
      latitude: 37.4467,
      longitude: 25.3289,
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3,
      area: 250.0,
      basePrice: 450,
      cleaningFee: 80,
      serviceFee: 50,
      taxes: 30,
      minStay: 5,
      maxStay: 14,
      checkInTime: '16:00',
      checkOutTime: '10:00',
      partyAllowed: true,
      images: [
        'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e08?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600607687644-c717919b84b2?w=800'
      ],
      ownerId: owners[1].id,
      amenityIds: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10] // wifi, parking, pool, gym, ac, kitchen, balcony, sea view, washing machine, tv
    },
    {
      titleGr: 'Studio Κοντά στην Παραλία',
      titleEn: 'Studio Near the Beach',
      descriptionGr: 'Άνετο studio μόλις 50 μέτρα από την παραλία, ιδανικό για διακοπές.',
      descriptionEn: 'Comfortable studio just 50 meters from the beach, perfect for vacation.',
      type: 'ROOM' as const,
      address: 'Ornos Beach',
      city: 'Mykonos',
      country: 'Greece',
      latitude: 37.4300,
      longitude: 25.3200,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      area: 35.0,
      basePrice: 150,
      cleaningFee: 25,
      serviceFee: 15,
      taxes: 9,
      minStay: 3,
      maxStay: 14,
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ],
      ownerId: owners[1].id,
      amenityIds: [0, 4, 5, 6, 8] // wifi, ac, kitchen, balcony, sea view
    },
    // Santorini Properties
    {
      titleGr: 'Σπήλαιο με Καλντερίμι Views',
      titleEn: 'Cave House with Caldera Views',
      descriptionGr: 'Αυθεντικό σπήλαιο με εκπληκτική θέα στο καλντερίμι, στο Οία.',
      descriptionEn: 'Authentic cave house with stunning caldera views in Oia.',
      type: 'LUXURY' as const,
      address: 'Oia Village',
      city: 'Santorini',
      country: 'Greece',
      latitude: 36.4619,
      longitude: 25.3753,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      area: 90.0,
      basePrice: 380,
      cleaningFee: 60,
      serviceFee: 40,
      taxes: 25,
      minStay: 3,
      maxStay: 10,
      images: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
      ],
      ownerId: owners[1].id,
      amenityIds: [0, 4, 5, 6, 8, 10] // wifi, ac, kitchen, balcony, sea view, tv
    },
    {
      titleGr: 'Πολυτελές Διαμέρισμα στη Φιρά',
      titleEn: 'Luxury Apartment in Fira',
      descriptionGr: 'Πολυτελές διαμέρισμα με θέα στο ηφαίστειο, στο κέντρο της Φιράς.',
      descriptionEn: 'Luxury apartment with volcano view in the center of Fira.',
      type: 'APARTMENT' as const,
      address: 'Fira Main Street 25',
      city: 'Santorini',
      country: 'Greece',
      latitude: 36.4166,
      longitude: 25.4322,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 2,
      area: 110.0,
      basePrice: 320,
      cleaningFee: 50,
      serviceFee: 35,
      taxes: 22,
      minStay: 2,
      maxStay: 10,
      images: [
        'https://images.unsplash.com/photo-1600607687644-c717919b84b2?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
      ],
      ownerId: owners[1].id,
      amenityIds: [0, 1, 4, 5, 6, 8, 9, 10] // wifi, parking, ac, kitchen, balcony, sea view, washing machine, tv
    },
    // Thessaloniki Properties
    {
      titleGr: 'Διαμέρισμα στο Λευκό Πύργο',
      titleEn: 'Apartment Near White Tower',
      descriptionGr: 'Άνετο διαμέρισμα 2 υπνοδωματίων κοντά στον Λευκό Πύργο.',
      descriptionEn: 'Comfortable 2-bedroom apartment near the White Tower.',
      type: 'APARTMENT' as const,
      address: 'Tsimiski Street 45',
      city: 'Thessaloniki',
      country: 'Greece',
      latitude: 40.6401,
      longitude: 22.9444,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      area: 80.0,
      basePrice: 85,
      cleaningFee: 20,
      serviceFee: 12,
      taxes: 6,
      minStay: 2,
      maxStay: 30,
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
      ],
      ownerId: owners[2].id,
      amenityIds: [0, 1, 4, 5, 7, 9, 10] // wifi, parking, ac, kitchen, elevator, washing machine, tv
    },
    {
      titleGr: 'Σπίτι 3 Υπνοδωματίων στο Κέντρο',
      titleEn: '3-Bedroom House in Center',
      descriptionGr: 'Σπίτι 3 υπνοδωματίων με αυλή, ιδανικό για οικογένειες.',
      descriptionEn: '3-bedroom house with yard, perfect for families.',
      type: 'HOUSE' as const,
      address: 'Egnatia Street 120',
      city: 'Thessaloniki',
      country: 'Greece',
      latitude: 40.6328,
      longitude: 22.9497,
      maxGuests: 6,
      bedrooms: 3,
      bathrooms: 2,
      area: 140.0,
      basePrice: 140,
      cleaningFee: 30,
      serviceFee: 18,
      taxes: 10,
      minStay: 3,
      maxStay: 30,
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
      ],
      ownerId: owners[2].id,
      amenityIds: [0, 1, 4, 5, 6, 9, 10] // wifi, parking, ac, kitchen, balcony, washing machine, tv
    },
    // Crete Properties
    {
      titleGr: 'Βίλα με Θέα στη Θάλασσα',
      titleEn: 'Villa with Sea View',
      descriptionGr: 'Εντυπωσιακή βίλα 5 υπνοδωματίων με ιδιωτική πισίνα και θέα στη θάλασσα.',
      descriptionEn: 'Impressive 5-bedroom villa with private pool and sea view.',
      type: 'VACATION_RENTAL' as const,
      address: 'Elounda Beach',
      city: 'Crete',
      country: 'Greece',
      latitude: 35.2401,
      longitude: 25.7214,
      maxGuests: 10,
      bedrooms: 5,
      bathrooms: 4,
      area: 350.0,
      basePrice: 550,
      cleaningFee: 100,
      serviceFee: 60,
      taxes: 40,
      minStay: 7,
      maxStay: 21,
      images: [
        'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e08?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600607687644-c717919b84b2?w=800'
      ],
      ownerId: owners[2].id,
      amenityIds: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10] // wifi, parking, pool, gym, ac, kitchen, balcony, sea view, washing machine, tv
    },
    {
      titleGr: 'Studio στη Χανιά',
      titleEn: 'Studio in Chania',
      descriptionGr: 'Άνετο studio στην παλιά πόλη της Χανιάς, κοντά στο λιμάνι.',
      descriptionEn: 'Comfortable studio in the old town of Chania, near the harbor.',
      type: 'ROOM' as const,
      address: 'Old Harbor, Chania',
      city: 'Crete',
      country: 'Greece',
      latitude: 35.5138,
      longitude: 24.0180,
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      area: 40.0,
      basePrice: 75,
      cleaningFee: 15,
      serviceFee: 10,
      taxes: 5,
      minStay: 2,
      maxStay: 14,
      images: [
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
      ],
      ownerId: owners[2].id,
      amenityIds: [0, 4, 5, 6, 8] // wifi, ac, kitchen, balcony, sea view
    },
    // Commercial Property
    {
      titleGr: 'Επαγγελματικός Χώρος στο Κέντρο',
      titleEn: 'Commercial Space in Center',
      descriptionGr: 'Επαγγελματικός χώρος 100 τ.μ. ιδανικός για γραφείο ή κατάστημα.',
      descriptionEn: '100 sqm commercial space perfect for office or store.',
      type: 'COMMERCIAL' as const,
      address: 'Stadiou Street 50',
      city: 'Athens',
      country: 'Greece',
      latitude: 37.9785,
      longitude: 23.7340,
      maxGuests: 20,
      bedrooms: 0,
      bathrooms: 2,
      area: 100.0,
      basePrice: 2500,
      cleaningFee: 0,
      serviceFee: 0,
      taxes: 0,
      minStay: 1,
      maxStay: 365,
      images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'
      ],
      ownerId: owners[0].id,
      amenityIds: [0, 1, 4, 7] // wifi, parking, ac, elevator
    }
  ];

  // Create properties sequentially, then link amenities separately
  // This avoids transaction issues with MongoDB Atlas M0
  const properties = [];
  for (let i = 0; i < propertyData.length; i++) {
    const prop = propertyData[i];
    const { amenityIds, serviceFee, ...propertyInfo } = prop;
    
    try {
      // Create property first (without nested creates to avoid transactions)
      const property = await retryOperation(
        () => prisma.property.create({ data: propertyInfo }),
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
  for (const booking of completedBookings.slice(0, 5)) {
    const property = properties.find(p => p.id === booking.propertyId);
    if (!property) continue;

    const ratings = [4, 4, 5, 5, 5]; // Mostly positive reviews
    const rating = ratings[Math.floor(Math.random() * ratings.length)];
    
    const reviewTitles = [
      'Great stay!',
      'Amazing property',
      'Perfect location',
      'Highly recommended',
      'Wonderful experience'
    ];
    
    const reviewComments = [
      'We had a wonderful time. The property was exactly as described.',
      'Perfect location and very clean. Would definitely stay again!',
      'Amazing views and great amenities. The host was very responsive.',
      'Beautiful property in a great location. Highly recommend!',
      'Exceeded our expectations. Everything was perfect!'
    ];

    await prisma.review.create({
      data: {
        propertyId: booking.propertyId,
        bookingId: booking.id,
        guestId: booking.guestId,
        rating: rating,
        title: reviewTitles[Math.floor(Math.random() * reviewTitles.length)],
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        isPublic: true
      }
    });
  }

  console.log(`✅ Created ${completedBookings.length} reviews`);

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
