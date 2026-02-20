/**
 * Complete Database Reset Script
 * Clears all rooms and admin users, then reseeds with fresh data
 * Usage: npx tsx scripts/reset-database.ts
 */
import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the reset script');
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

interface AdminUser {
  email: string;
  name: string;
  password: string;
  phone?: string;
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: 'konstantinosblavakis@gmail.com',
    name: 'Konstantinos Blavakis',
    password: 'admin123',
    phone: '+30 210 000 0000'
  },
  {
    email: 'admin@stefanos.com',
    name: 'Stefanos Admin',
    password: 'admin123',
    phone: '+30 210 111 1111'
  },
  {
    email: 'admin@smholdings.gr',
    name: 'SM Holdings Admin',
    password: 'admin123',
    phone: '+30 210 444 4444'
  },
  {
    email: 'manager@incanto.com',
    name: 'Incanto Manager',
    password: 'manager123',
    phone: '+30 210 222 2222'
  },
  {
    email: 'superadmin@stefanos.com',
    name: 'Super Admin',
    password: 'super123',
    phone: '+30 210 333 3333'
  }
];

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // Step 1: Clear existing data in correct order (respect foreign keys)
    console.log('\n🗑️  Clearing existing data...');
    
    // Clear room-related data first
    const deletedRoomContents = await prisma.roomContent.deleteMany();
    console.log(`   Deleted ${deletedRoomContents.count} room content records`);
    
    const deletedRoomAvailabilityRules = await prisma.roomAvailabilityRule.deleteMany();
    console.log(`   Deleted ${deletedRoomAvailabilityRules.count} room availability rules`);
    
    const deletedRooms = await prisma.room.deleteMany();
    console.log(`   Deleted ${deletedRooms.count} rooms`);
    
    // Clear admin users (keep regular users)
    const deletedAdmins = await prisma.user.deleteMany({
      where: {
        role: {
          in: ['ADMIN', 'PROPERTY_OWNER', 'MANAGER']
        }
      }
    });
    console.log(`   Deleted ${deletedAdmins.count} admin/manager users`);
    
    // Clear properties that might be orphaned
    const deletedProperties = await prisma.property.deleteMany({
      where: {
        titleEn: {
          contains: 'Incanto'
        }
      }
    });
    console.log(`   Deleted ${deletedProperties.count} Incanto properties`);
    
    console.log('✅ Data clearing completed');
    
    // Step 2: Create admin users
    console.log('\n👤 Creating admin users...');
    
    for (const admin of ADMIN_USERS) {
      const hashedPassword = await hashPassword(admin.password);
      
      const user = await prisma.user.create({
        data: {
          email: admin.email,
          name: admin.name,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=3b82f6&color=fff`,
          phone: admin.phone,
          emailVerified: true,
          phoneVerified: true,
          preferredCurrency: 'EUR',
          preferredLanguage: 'en',
          mfaEnabled: false
        }
      });
      
      console.log(`   ✅ Created admin: ${admin.email} (${admin.name})`);
    }
    
    // Step 3: Create Incanto property and rooms
    console.log('\n🏨 Creating Incanto Hotel property and rooms...');
    
    // Get the first admin user as property owner
    const propertyOwner = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!propertyOwner) {
      throw new Error('No admin user found to assign as property owner');
    }
    
    // Create Incanto Hotel property
    const incantoProperty = await prisma.property.create({
      data: {
        titleGr: 'Incanto Hotel',
        titleEn: 'Incanto Hotel',
        descriptionGr: 'Luxury hotel in Preveza with stunning sea views and premium amenities.',
        descriptionEn: 'Luxury hotel in Preveza with stunning sea views and premium amenities.',
        type: 'COMMERCIAL',
        status: 'ACTIVE',
        address: 'Akti Miaouli, Preveza',
        city: 'Preveza',
        country: 'Greece',
        latitude: 38.9595,
        longitude: 20.7533,
        postalCode: '481 00',
        maxGuests: 50,
        bedrooms: 20,
        bathrooms: 20,
        area: 2000,
        basePrice: 150,
        currency: 'EUR',
        cleaningFee: 50,
        serviceFeePercentage: 10,
        taxes: 24,
        taxRate: 24,
        minStay: 1,
        maxStay: 30,
        advanceBooking: 30,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'FLEXIBLE',
        houseRules: 'No smoking, No parties, Quiet hours 22:00-07:00',
        petFriendly: false,
        smokingAllowed: false,
        partyAllowed: false,
        hasDynamicRooms: true,
        ownerId: propertyOwner.id,
        images: [
          '/incanto-logo.png',
          '/background for header.png'
        ]
      }
    });
    
    console.log(`   ✅ Created property: ${incantoProperty.titleEn}`);
    
    // Create rooms for the property
    const rooms = [
      {
        name: 'Deluxe Room - Ground Floor No1',
        nameGr: 'Deluxe Room - Ground Floor No1',
        nameEn: 'Deluxe Room - Ground Floor No1',
        type: 'BEDROOM' as const,
        capacity: 2,
        maxAdults: 2,
        basePrice: 150,
        descriptionGr: 'Elegant comfort with Mediterranean views and modern amenities.',
        descriptionEn: 'Elegant comfort with Mediterranean views and modern amenities.',
        amenities: ['Sea View', 'King Bed', 'Mini Bar', 'Workspace', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/1. ground floor No1/room1.jpg']
      },
      {
        name: 'Garden Room - Ground Floor No2',
        nameGr: 'Garden Room - Ground Floor No2',
        nameEn: 'Garden Room - Ground Floor No2',
        type: 'BEDROOM' as const,
        capacity: 2,
        maxAdults: 2,
        basePrice: 120,
        descriptionGr: 'Cozy ground-floor room overlooking the garden.',
        descriptionEn: 'Cozy ground-floor room overlooking the garden.',
        amenities: ['Garden View', 'Queen Bed', 'Balcony', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/2. ground floor No2/room2.jpg']
      },
      {
        name: 'Premium Room - First Floor No3',
        nameGr: 'Premium Room - First Floor No3',
        nameEn: 'Premium Room - First Floor No3',
        type: 'BEDROOM' as const,
        capacity: 2,
        maxAdults: 2,
        basePrice: 180,
        descriptionGr: 'Bright first-floor room with refined interiors and sea breeze.',
        descriptionEn: 'Bright first-floor room with refined interiors and sea breeze.',
        amenities: ['Sea View', 'King Bed', 'Smart TV', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/3. first floor No3/room3.jpg']
      },
      {
        name: 'Superior Room - First Floor No4',
        nameGr: 'Superior Room - First Floor No4',
        nameEn: 'Superior Room - First Floor No4',
        type: 'BEDROOM' as const,
        capacity: 3,
        maxAdults: 3,
        basePrice: 210,
        descriptionGr: 'Spacious superior room with stylish decor and premium comfort.',
        descriptionEn: 'Spacious superior room with stylish decor and premium comfort.',
        amenities: ['Sea View', 'King Bed', 'Sofa Bed', 'Mini Bar', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/4. first floor No4/room4.jpg']
      },
      {
        name: 'Executive Suite - First Floor No5',
        nameGr: 'Executive Suite - First Floor No5',
        nameEn: 'Executive Suite - First Floor No5',
        type: 'STUDIO' as const,
        capacity: 3,
        maxAdults: 3,
        basePrice: 250,
        descriptionGr: 'Spacious suite with separate living area and panoramic views.',
        descriptionEn: 'Spacious suite with separate living area and panoramic views.',
        amenities: ['Panoramic View', 'Living Area', 'Jacuzzi', 'Premium Amenities', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/5. first floor No5/room5.jpg']
      },
      {
        name: 'Panorama Room - Second Floor No6',
        nameGr: 'Panorama Room - Second Floor No6',
        nameEn: 'Panorama Room - Second Floor No6',
        type: 'BEDROOM' as const,
        capacity: 3,
        maxAdults: 3,
        basePrice: 240,
        descriptionGr: 'Second-floor room with expansive views and contemporary style.',
        descriptionEn: 'Second-floor room with expansive views and contemporary style.',
        amenities: ['Panoramic View', 'King Bed', 'Smart TV', 'Mini Bar', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/6. second floor No6/room6.jpg']
      },
      {
        name: 'Family Suite - Second Floor No7',
        nameGr: 'Family Suite - Second Floor No7',
        nameEn: 'Family Suite - Second Floor No7',
        type: 'STUDIO' as const,
        capacity: 5,
        maxAdults: 4,
        basePrice: 320,
        descriptionGr: 'Ideal family suite with generous space and flexible sleeping setup.',
        descriptionEn: 'Ideal family suite with generous space and flexible sleeping setup.',
        amenities: ['Sea View', '2 Bedrooms', 'Kitchenette', 'Kids Area', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/7. second floor No7/room7.jpg']
      },
      {
        name: 'Ocean Suite - Second Floor No8',
        nameGr: 'Ocean Suite - Second Floor No8',
        nameEn: 'Ocean Suite - Second Floor No8',
        type: 'STUDIO' as const,
        capacity: 4,
        maxAdults: 4,
        basePrice: 340,
        descriptionGr: 'Premium suite with ocean-facing views and elevated comfort.',
        descriptionEn: 'Premium suite with ocean-facing views and elevated comfort.',
        amenities: ['Ocean View', 'King Bed', 'Lounge Area', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/8. second floor No8/room8.jpg']
      },
      {
        name: 'Honeymoon Suite - Third Floor No9',
        nameGr: 'Honeymoon Suite - Third Floor No9',
        nameEn: 'Honeymoon Suite - Third Floor No9',
        type: 'STUDIO' as const,
        capacity: 2,
        maxAdults: 2,
        basePrice: 380,
        descriptionGr: 'Romantic suite designed for unforgettable stays.',
        descriptionEn: 'Romantic suite designed for unforgettable stays.',
        amenities: ['Ocean View', 'Private Jacuzzi', 'Champagne Bar', 'Romantic Decor', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/9. third floor No9/room9.jpg']
      },
      {
        name: 'Presidential Suite - Third Floor No10',
        nameGr: 'Presidential Suite - Third Floor No10',
        nameEn: 'Presidential Suite - Third Floor No10',
        type: 'STUDIO' as const,
        capacity: 4,
        maxAdults: 4,
        basePrice: 450,
        descriptionGr: 'Signature top-floor suite with the highest level of luxury.',
        descriptionEn: 'Signature top-floor suite with the highest level of luxury.',
        amenities: ['Ocean View', '2 Bedrooms', 'Private Terrace', 'Butler Service', 'Free WiFi', 'Free TV Channels', 'Free Air Conditioning'],
        images: ['/10. third floor No10/room10.jpg']
      }
    ];
    
    let roomsCreated = 0;
    for (const room of rooms) {
      await prisma.room.create({
        data: {
          ...room,
          propertyId: incantoProperty.id,
          ownerId: propertyOwner.id,
          isBookable: true
        }
      });
      roomsCreated++;
      console.log(`   ✅ Created room: ${room.name}`);
    }
    
    console.log('\n🎉 Database reset completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Admin users created: ${ADMIN_USERS.length}`);
    console.log(`   - Properties created: 1`);
    console.log(`   - Rooms created: ${roomsCreated}`);
    
    console.log('\n🔑 Admin Credentials:');
    ADMIN_USERS.forEach(admin => {
      console.log(`   - Email: ${admin.email}`);
      console.log(`     Password: ${admin.password}`);
      console.log(`     Name: ${admin.name}`);
      console.log('');
    });
    
  } catch (error: any) {
    console.error('❌ Error during database reset:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset function
resetDatabase()
  .catch((error) => {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
