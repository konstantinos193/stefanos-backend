import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function updatePropertyOwner() {
  console.log('🔄 Updating Incanto Hotel property owner...');
  
  try {
    // Find the admin@smholdings.gr user
    const newOwner = await prisma.user.findUnique({
      where: { email: 'admin@smholdings.gr' }
    });
    
    if (!newOwner) {
      console.error('❌ admin@smholdings.gr user not found');
      return;
    }
    
    // Find Incanto Hotel property
    const incanto = await prisma.property.findFirst({
      where: { titleEn: { contains: 'Incanto' } }
    });
    
    if (!incanto) {
      console.error('❌ Incanto Hotel property not found');
      return;
    }
    
    // Update property owner
    const updatedProperty = await prisma.property.update({
      where: { id: incanto.id },
      data: { ownerId: newOwner.id }
    });
    
    console.log(`✅ Updated Incanto Hotel owner to: ${newOwner.email} (${newOwner.name})`);
    
    // Update all rooms to have the new owner
    const updatedRooms = await prisma.room.updateMany({
      where: { propertyId: incanto.id },
      data: { ownerId: newOwner.id }
    });
    
    console.log(`✅ Updated ${updatedRooms.count} rooms to new owner`);
    
    console.log('\n📋 Updated Ownership Summary:');
    console.log(`   Property: ${updatedProperty.titleEn}`);
    console.log(`   New Owner: ${newOwner.email} (${newOwner.role})`);
    console.log(`   Rooms Updated: ${updatedRooms.count}`);
    
  } catch (error: any) {
    console.error('❌ Error updating property owner:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updatePropertyOwner();
