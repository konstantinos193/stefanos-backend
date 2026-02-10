import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
  log: ['error'],
});

async function createIncantoProperty() {
  try {
    console.log('🌱 Creating Incanto Hotel property...');

    // Create or get admin user
    let admin = await prisma.user.findFirst({
      where: { email: 'admin@incanto.com' }
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@incanto.com',
          name: 'Incanto Admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
          isActive: true,
        }
      });
      console.log('✅ Created admin user');
    }

    // Create Incanto Hotel property
    const existingProperty = await prisma.property.findFirst({
      where: { titleEn: 'L\'Incanto Hotel' }
    });

    if (!existingProperty) {
      const property = await prisma.property.create({
        data: {
          titleGr: 'L\'Incanto Hotel',
          titleEn: 'L\'Incanto Hotel',
          descriptionGr: 'Αποκλειστικό ξενοδοχείο στην Πρέβεζα με πανοραμική θέα στο Ιόνιο Πέλαγος.',
          descriptionEn: 'Exclusive hotel in Preveza with panoramic views of the Ionian Sea.',
          type: 'LUXURY',
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
          cancellationPolicy: 'MODERATE',
          houseRules: 'No smoking, no parties, quiet hours after 11 PM',
          petFriendly: false,
          smokingAllowed: false,
          partyAllowed: false,
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
          ],
          owner: { connect: { id: admin.id } }
        }
      });

      console.log('✅ Created Incanto Hotel property with ID:', property.id);
      return property.id;
    } else {
      console.log('✅ Incanto Hotel property already exists with ID:', existingProperty.id);
      return existingProperty.id;
    }
  } catch (error: any) {
    console.error('❌ Error creating property:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createIncantoProperty();
