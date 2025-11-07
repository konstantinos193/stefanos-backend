import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create amenities
  const amenities = await Promise.all([
    prisma.amenity.upsert({
      where: { id: 'wifi' },
      update: {},
      create: {
        id: 'wifi',
        nameGr: 'WiFi',
        nameEn: 'WiFi',
        icon: 'wifi',
        category: 'internet'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'parking' },
      update: {},
      create: {
        id: 'parking',
        nameGr: 'Πάρκινγκ',
        nameEn: 'Parking',
        icon: 'car',
        category: 'transportation'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'pool' },
      update: {},
      create: {
        id: 'pool',
        nameGr: 'Πισίνα',
        nameEn: 'Pool',
        icon: 'swimming-pool',
        category: 'recreation'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'gym' },
      update: {},
      create: {
        id: 'gym',
        nameGr: 'Γυμναστήριο',
        nameEn: 'Gym',
        icon: 'dumbbell',
        category: 'recreation'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'ac' },
      update: {},
      create: {
        id: 'ac',
        nameGr: 'Κλιματισμός',
        nameEn: 'Air Conditioning',
        icon: 'snowflake',
        category: 'comfort'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'kitchen' },
      update: {},
      create: {
        id: 'kitchen',
        nameGr: 'Κουζίνα',
        nameEn: 'Kitchen',
        icon: 'utensils',
        category: 'comfort'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'balcony' },
      update: {},
      create: {
        id: 'balcony',
        nameGr: 'Μπαλκόνι',
        nameEn: 'Balcony',
        icon: 'home',
        category: 'outdoor'
      }
    }),
    prisma.amenity.upsert({
      where: { id: 'elevator' },
      update: {},
      create: {
        id: 'elevator',
        nameGr: 'Ασανσέρ',
        nameEn: 'Elevator',
        icon: 'arrow-up',
        category: 'accessibility'
      }
    })
  ]);

  console.log('✅ Amenities created');

  // Create admin user
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestate.com' },
    update: {},
    create: {
      email: 'admin@realestate.com',
      name: 'Admin User',
      phone: '+30 210 123 4567',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log('✅ Admin user created');

  // Create property owner
  const ownerPassword = await hashPassword('owner123');
  const owner = await prisma.user.upsert({
    where: { email: 'owner@realestate.com' },
    update: {},
    create: {
      email: 'owner@realestate.com',
      name: 'Property Owner',
      phone: '+30 210 987 6543',
      role: 'PROPERTY_OWNER',
      isActive: true
    }
  });

  console.log('✅ Property owner created');

  // Create sample properties
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        titleGr: 'Ξενοδοχείο Αθήνα',
        titleEn: 'Athens Hotel',
        descriptionGr: 'Καταπληκτικό ξενοδοχείο στο κέντρο της Αθήνας',
        descriptionEn: 'Amazing hotel in the center of Athens',
        type: 'APARTMENT',
        address: 'Syntagma Square 1',
        city: 'Athens',
        country: 'Greece',
        latitude: 37.9755,
        longitude: 23.7348,
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        area: 75.5,
        basePrice: 120.0,
        currency: 'EUR',
        cleaningFee: 25.0,
        serviceFee: 15.0,
        taxes: 8.0,
        minStay: 2,
        maxStay: 30,
        advanceBooking: 60,
        checkInTime: '15:00',
        checkOutTime: '11:00',
        cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
        houseRules: 'No smoking, no parties, pets allowed',
        petFriendly: true,
        smokingAllowed: false,
        partyAllowed: false,
        images: [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
        ],
        ownerId: owner.id,
        amenities: {
          create: [
            { amenityId: 'wifi' },
            { amenityId: 'ac' },
            { amenityId: 'kitchen' },
            { amenityId: 'elevator' }
          ]
        }
      }
    }),
    prisma.property.create({
      data: {
        titleGr: 'Βίλα Μυκόνου',
        titleEn: 'Mykonos Villa',
        descriptionGr: 'Απίστευτη βίλα με θέα στη θάλασσα στη Μύκονο',
        descriptionEn: 'Incredible villa with sea view in Mykonos',
        type: 'HOUSE',
        address: 'Paradise Beach',
        city: 'Mykonos',
        country: 'Greece',
        latitude: 37.4467,
        longitude: 25.3289,
        maxGuests: 8,
        bedrooms: 4,
        bathrooms: 3,
        area: 200.0,
        basePrice: 350.0,
        currency: 'EUR',
        cleaningFee: 50.0,
        serviceFee: 30.0,
        taxes: 20.0,
        minStay: 3,
        maxStay: 14,
        advanceBooking: 90,
        checkInTime: '16:00',
        checkOutTime: '10:00',
        cancellationPolicy: 'Free cancellation up to 48 hours before check-in',
        houseRules: 'No smoking, parties allowed, pets allowed',
        petFriendly: true,
        smokingAllowed: false,
        partyAllowed: true,
        images: [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ],
        ownerId: owner.id,
        amenities: {
          create: [
            { amenityId: 'wifi' },
            { amenityId: 'pool' },
            { amenityId: 'gym' },
            { amenityId: 'parking' },
            { amenityId: 'balcony' }
          ]
        }
      }
    })
  ]);

  console.log('✅ Sample properties created');

  // Create sample services
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
    })
  ]);

  console.log('✅ Sample services created');

  // Create sample editions
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

  console.log('✅ Sample editions created');

  // Create sample knowledge articles
  const knowledgeArticles = await Promise.all([
    prisma.knowledgeArticle.create({
      data: {
        titleGr: 'Οδηγός Επένδυσης σε Ακίνητα',
        titleEn: 'Real Estate Investment Guide',
        contentGr: 'Όλα όσα χρειάζεται να ξέρετε για την επένδυση σε ακίνητα',
        contentEn: 'Everything you need to know about real estate investment',
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
        contentGr: 'Οι νομικές υποχρεώσεις για ιδιοκτήτες ακινήτων',
        contentEn: 'Legal requirements for property owners',
        category: 'legal',
        tags: ['legal', 'requirements', 'property-owners'],
        author: 'Legal Team',
        readTime: 10,
        publishedAt: new Date()
      }
    })
  ]);

  console.log('✅ Sample knowledge articles created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
