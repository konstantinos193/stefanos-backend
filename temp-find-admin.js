const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAdmin() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('Admin users found:');
    console.log(JSON.stringify(admins, null, 2));
    
    // Also check for any property owners
    const owners = await prisma.user.findMany({
      where: {
        role: 'PROPERTY_OWNER'
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\nProperty owners found:');
    console.log(JSON.stringify(owners, null, 2));
    
    // Check room ownership for the specific room in the error
    const roomId = 'b11fd1a8-2033-4e54-b53b-5c0823cc9b2b';
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        property: {
          select: {
            id: true,
            titleGr: true,
            ownerId: true
          }
        }
      }
    });
    
    console.log('\nRoom ownership info:');
    console.log(JSON.stringify(room, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAdmin();
