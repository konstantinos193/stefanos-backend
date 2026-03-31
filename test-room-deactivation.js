// Test script to verify room deactivation based on property status
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoomDeactivation() {
  try {
    console.log('Testing room deactivation based on property status...\n');

    // Get all rooms with their property status
    const rooms = await prisma.room.findMany({
      include: {
        property: {
          select: {
            id: true,
            titleGr: true,
            titleEn: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    console.log(`Found ${rooms.length} total rooms\n`);

    // Group rooms by property status
    const activePropertyRooms = rooms.filter(room => room.property.status === 'ACTIVE');
    const inactivePropertyRooms = rooms.filter(room => room.property.status !== 'ACTIVE');

    console.log(`Rooms from ACTIVE properties: ${activePropertyRooms.length}`);
    console.log(`Rooms from INACTIVE properties: ${inactivePropertyRooms.length}\n`);

    // Show details of inactive property rooms
    if (inactivePropertyRooms.length > 0) {
      console.log('Rooms from inactive properties (should be marked as non-bookable):');
      inactivePropertyRooms.forEach(room => {
        const currentIsBookable = room.isBookable;
        const shouldBeBookable = currentIsBookable && room.property.status === 'ACTIVE';
        
        console.log(`- ${room.name} (Property: ${room.property.titleEn || room.property.titleGr})`);
        console.log(`  Property Status: ${room.property.status}`);
        console.log(`  Current isBookable: ${currentIsBookable}`);
        console.log(`  Should be bookable: ${shouldBeBookable}`);
        console.log(`  Status: ${shouldBeBookable ? '✅ Available' : '🚫 Not available to book'}\n`);
      });
    }

    // Show room 10 specifically if it exists
    const room10 = rooms.find(room => room.name.includes('10') || room.nameEn?.includes('10'));
    if (room10) {
      console.log('=== Room 10 Details ===');
      console.log(`Name: ${room10.nameEn || room10.name}`);
      console.log(`Property: ${room10.property.titleEn || room10.property.titleGr}`);
      console.log(`Property Status: ${room10.property.status}`);
      console.log(`Current isBookable: ${room10.isBookable}`);
      console.log(`Should be bookable: ${room10.isBookable && room10.property.status === 'ACTIVE'}`);
      console.log(`UI Status: ${room10.isBookable && room10.property.status === 'ACTIVE' ? 'Available' : 'Not available to book'}`);
    } else {
      console.log('Room 10 not found in the database');
    }

  } catch (error) {
    console.error('Error testing room deactivation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoomDeactivation();
