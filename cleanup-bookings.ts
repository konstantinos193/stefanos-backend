import dotenv from 'dotenv';
import { PrismaClient } from './prisma/generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Load environment variables
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaLibSql({
  url: dbUrl
});

const prisma = new PrismaClient({
  adapter,
  log: ['query']
});

async function cleanupBookings() {
  try {
    console.log('🧹 Starting database cleanup...');

    // List of test guest names to delete
    const testGuests = [
      'SALCITO GIOVANNI',
      'konstantinos konstantinos',
      'konstantinos',
      'ΧΨΩΒΗ',
      'fvhdfdfhd',
      'gcfhnfgh',
      'Michael Brown',
      'John Smith',
      'Emma Johnson'
    ];

    console.log('📋 Found test guests:', testGuests);

    // Find all bookings with test guest names
    const bookingsToDelete = await prisma.booking.findMany({
      where: {
        OR: testGuests.map(guest => ({
          guestName: {
            contains: guest
          }
        }))
      }
    });

    console.log(`📊 Found ${bookingsToDelete.length} test bookings to delete:`);
    
    bookingsToDelete.forEach((booking: any) => {
      console.log(`  - ${booking.id.slice(-6)}: ${booking.guestName} - ${booking.totalPrice}€ - ${booking.status}`);
    });

    if (bookingsToDelete.length === 0) {
      console.log('✅ No test bookings found to delete.');
      return;
    }

    // Delete the bookings
    const deleteResult = await prisma.booking.deleteMany({
      where: {
        id: {
          in: bookingsToDelete.map((b: any) => b.id)
        }
      }
    });

    console.log(`🗑️  Successfully deleted ${deleteResult.count} bookings!`);

    // Verify cleanup
    const remainingBookings = await prisma.booking.findMany({
      where: {
        OR: testGuests.map(guest => ({
          guestName: {
            contains: guest
          }
        }))
      }
    });

    if (remainingBookings.length === 0) {
      console.log('✅ All test bookings successfully removed from database!');
    } else {
      console.log(`⚠️  ${remainingBookings.length} bookings still remain:`);
      remainingBookings.forEach((booking: any) => {
        console.log(`  - ${booking.id.slice(-6)}: ${booking.guestName}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupBookings();
