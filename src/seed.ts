import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Test database connection first
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('\n💡 Please check:');
    console.error('   1. Your DATABASE_URL in .env file');
    console.error('   2. MongoDB Atlas IP whitelist (add your IP address)');
    console.error('   3. Network connectivity');
    throw error;
  }

  // Clear existing data (optional - skip if it fails)
  console.log('🧹 Cleaning existing data...');
  try {
    await prisma.propertyAmenity.deleteMany();
    await prisma.propertyAvailability.deleteMany();
    await prisma.review.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.property.deleteMany();
    await prisma.amenity.deleteMany();
    await prisma.user.deleteMany();
    await prisma.service.deleteMany();
    await prisma.edition.deleteMany();
    await prisma.knowledgeArticle.deleteMany();
    console.log('✅ Existing data cleaned');
  } catch (error) {
    console.warn('⚠️  Warning: Could not clean existing data (continuing anyway):', error);
    console.warn('   This is okay if the database is empty or if you want to keep existing data');
  }

  // Create amenities
  console.log('📦 Creating amenities...');
  const amenities = await Promise.all([
    prisma.amenity.create({
      data: {
        nameGr: 'WiFi',
        nameEn: 'WiFi',
        icon: 'wifi',
        category: 'internet'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Πάρκινγκ',
        nameEn: 'Parking',
        icon: 'car',
        category: 'transportation'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Πισίνα',
        nameEn: 'Pool',
        icon: 'swimming-pool',
        category: 'recreation'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Γυμναστήριο',
        nameEn: 'Gym',
        icon: 'dumbbell',
        category: 'recreation'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Κλιματισμός',
        nameEn: 'Air Conditioning',
        icon: 'snowflake',
        category: 'comfort'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Κουζίνα',
        nameEn: 'Kitchen',
        icon: 'utensils',
        category: 'comfort'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Μπαλκόνι',
        nameEn: 'Balcony',
        icon: 'home',
        category: 'outdoor'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Ασανσέρ',
        nameEn: 'Elevator',
        icon: 'arrow-up',
        category: 'accessibility'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Θέα στη θάλασσα',
        nameEn: 'Sea View',
        icon: 'water',
        category: 'view'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Πλυντήριο',
        nameEn: 'Washing Machine',
        icon: 'washing-machine',
        category: 'comfort'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Τηλεόραση',
        nameEn: 'TV',
        icon: 'tv',
        category: 'entertainment'
      }
    }),
    prisma.amenity.create({
      data: {
        nameGr: 'Προσβάσιμο για ΑΜΕΑ',
        nameEn: 'Wheelchair Accessible',
        icon: 'wheelchair',
        category: 'accessibility'
      }
    })
  ]);

  console.log(`✅ Created ${amenities.length} amenities`);

  // Create users
  console.log('👥 Creating users...');
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.create({
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

  const owners = await Promise.all([
    prisma.user.create({
      data: {
        email: 'owner1@realestate.com',
        name: 'Stefanos Spyros',
        phone: '+30 210 987 6543',
        password: await hashPassword('owner123'),
        role: 'PROPERTY_OWNER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Stefanos+Spyros&background=d4af37&color=000'
      }
    }),
    prisma.user.create({
      data: {
        email: 'owner2@realestate.com',
        name: 'Maria Papadopoulou',
        phone: '+30 231 123 4567',
        password: await hashPassword('owner123'),
        role: 'PROPERTY_OWNER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Maria+Papadopoulou&background=d4af37&color=000'
      }
    }),
    prisma.user.create({
      data: {
        email: 'owner3@realestate.com',
        name: 'Dimitris Georgiou',
        phone: '+30 228 765 4321',
        password: await hashPassword('owner123'),
        role: 'PROPERTY_OWNER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Dimitris+Georgiou&background=d4af37&color=000'
      }
    })
  ]);

  const guests = await Promise.all([
    prisma.user.create({
      data: {
        email: 'guest1@example.com',
        name: 'John Smith',
        phone: '+1 555 123 4567',
        password: await hashPassword('guest123'),
        role: 'USER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=John+Smith&background=3b82f6&color=fff'
      }
    }),
    prisma.user.create({
      data: {
        email: 'guest2@example.com',
        name: 'Emma Johnson',
        phone: '+44 20 1234 5678',
        password: await hashPassword('guest123'),
        role: 'USER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Emma+Johnson&background=10b981&color=fff'
      }
    }),
    prisma.user.create({
      data: {
        email: 'guest3@example.com',
        name: 'Michael Brown',
        phone: '+49 30 12345678',
        password: await hashPassword('guest123'),
        role: 'USER',
        isActive: true,
        avatar: 'https://ui-avatars.com/api/?name=Michael+Brown&background=f59e0b&color=fff'
      }
    })
  ]);

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
      cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
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

  const properties = [];
  for (const prop of propertyData) {
    const { amenityIds, ...propertyInfo } = prop;
    const property = await prisma.property.create({
      data: {
        ...propertyInfo,
        amenities: {
          create: amenityIds.map(amenityIndex => ({
            amenityId: amenities[amenityIndex].id
          }))
        }
      }
    });
    properties.push(property);
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
    const serviceFee = property.serviceFee || 0;
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
  const services = await Promise.all([
    prisma.service.create({
      data: {
        titleGr: 'Διαχείριση Ακινήτων',
        titleEn: 'Property Management',
        descriptionGr: 'Αξιόπιστη διαχείριση των ακινήτων σας',
        descriptionEn: 'Reliable management of your properties',
        icon: 'building',
        features: ['24/7 Support', 'Maintenance', 'Tenant Screening', 'Financial Reports'],
        pricingGr: 'Από 200€/μήνα',
        pricingEn: 'From €200/month',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        titleGr: 'Πλατφόρμα Κρατήσεων',
        titleEn: 'Booking Platform',
        descriptionGr: 'Σύγχρονη πλατφόρμα για κρατήσεις',
        descriptionEn: 'Modern platform for bookings',
        icon: 'calendar',
        features: ['Online Booking', 'Payment Processing', 'Calendar Sync', 'Guest Communication'],
        pricingGr: '3% ανά κράτηση',
        pricingEn: '3% per booking',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
        titleGr: 'Ανάλυση Αγοράς',
        titleEn: 'Market Analysis',
        descriptionGr: 'Συμβουλές για την αγορά ακινήτων',
        descriptionEn: 'Advice for real estate investment',
        icon: 'chart-line',
        features: ['Market Trends', 'Price Analysis', 'Investment Opportunities', 'Risk Assessment'],
        pricingGr: 'Από 500€',
        pricingEn: 'From €500',
        isActive: true
      }
    }),
    prisma.service.create({
      data: {
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
    })
  ]);

  console.log(`✅ Created ${services.length} services`);

  // Create editions
  console.log('📚 Creating editions...');
  const editions = await Promise.all([
    prisma.edition.create({
      data: {
        category: 'real-estate',
        titleGr: 'Κατοικίες',
        titleEn: 'Residential Properties',
        descriptionGr: 'Σύγχρονα διαμερίσματα και σπίτια',
        descriptionEn: 'Modern apartments and houses',
        contentGr: 'Ανακαλύψτε τα καλύτερα ακίνητα για κατοικία',
        contentEn: 'Discover the best properties for living',
        status: 'PUBLISHED',
        featured: true,
        order: 1
      }
    }),
    prisma.edition.create({
      data: {
        category: 'real-estate',
        titleGr: 'Επαγγελματικά',
        titleEn: 'Commercial Properties',
        descriptionGr: 'Γραφεία και εμπορικούς χώρους',
        descriptionEn: 'Offices and commercial spaces',
        contentGr: 'Ιδανικά ακίνητα για την επιχείρησή σας',
        contentEn: 'Perfect properties for your business',
        status: 'PUBLISHED',
        featured: true,
        order: 2
      }
    }),
    prisma.edition.create({
      data: {
        category: 'booking',
        titleGr: 'Βραχυχρόνιες Κρατήσεις',
        titleEn: 'Short-term Rentals',
        descriptionGr: 'Κρατήσεις για διακοπές και ταξίδια',
        descriptionEn: 'Bookings for vacations and travel',
        contentGr: 'Βρείτε το ιδανικό μέρος για τις διακοπές σας',
        contentEn: 'Find the perfect place for your vacation',
        status: 'PUBLISHED',
        featured: true,
        order: 3
      }
    })
  ]);

  console.log(`✅ Created ${editions.length} editions`);

  // Create knowledge articles
  console.log('📖 Creating knowledge articles...');
  const knowledgeArticles = await Promise.all([
    prisma.knowledgeArticle.create({
      data: {
        titleGr: 'Οδηγός Επένδυσης σε Ακίνητα',
        titleEn: 'Real Estate Investment Guide',
        contentGr: 'Όλα όσα χρειάζεται να ξέρετε για την επένδυση σε ακίνητα. Από την ανάλυση της αγοράς έως τη διαχείριση του ακινήτου.',
        contentEn: 'Everything you need to know about real estate investment. From market analysis to property management.',
        category: 'investment',
        tags: ['investment', 'real-estate', 'guide'],
        author: 'Real Estate Team',
        readTime: 15,
        publishedAt: new Date()
      }
    }),
    prisma.knowledgeArticle.create({
      data: {
        titleGr: 'Νομικές Υποχρεώσεις',
        titleEn: 'Legal Requirements',
        contentGr: 'Οι νομικές υποχρεώσεις για ιδιοκτήτες ακινήτων. Συμβάσεις, φόροι, και άδειες.',
        contentEn: 'Legal requirements for property owners. Contracts, taxes, and permits.',
        category: 'legal',
        tags: ['legal', 'requirements', 'property-owners'],
        author: 'Legal Team',
        readTime: 10,
        publishedAt: new Date()
      }
    }),
    prisma.knowledgeArticle.create({
      data: {
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
    })
  ]);

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
  console.log('   Owner: owner1@realestate.com / owner123');
  console.log('   Guest: guest1@example.com / guest123');
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seed:', e);
    if (e.code === 'P2010' || e.message?.includes('Server selection timeout')) {
      console.error('\n💡 This looks like a database connection issue.');
      console.error('   Please check:');
      console.error('   1. Your DATABASE_URL in .env file is correct');
      console.error('   2. MongoDB Atlas allows connections from your IP address');
      console.error('   3. Your network connection is stable');
      console.error('   4. MongoDB Atlas cluster is running');
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
