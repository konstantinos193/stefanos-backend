import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function checkRoomOwnership() {
  console.log('🔍 Checking room ownership for the problematic room...');
  
  try {
    const roomId = 'f24c35f3-cf88-41c7-acbb-d924506ddda9';
    
    // Get the specific room
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: {
          include: {
            owner: {
              select: {
                email: true,
                name: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    if (!room) {
      console.error('❌ Room not found');
      return;
    }
    
    console.log(`🏠 Room: ${room.name}`);
    console.log(`📧 Room Owner: ${room.ownerId}`);
    console.log(`🏨 Property: ${room.property.titleEn}`);
    console.log(`👤 Property Owner: ${room.property.owner.email} (${room.property.owner.role})`);
    
    // Check if room.ownerId matches property.ownerId
    if (room.ownerId === room.property.ownerId) {
      console.log('✅ Room ownership is consistent');
    } else {
      console.log('❌ Room ownership is inconsistent!');
      console.log(`   Room ownerId: ${room.ownerId}`);
      console.log(`   Property ownerId: ${room.property.ownerId}`);
      
      // Fix the room ownership
      console.log('\n🔧 Fixing room ownership...');
      await prisma.room.update({
        where: { id: roomId },
        data: { ownerId: room.property.ownerId }
      });
      console.log('✅ Room ownership fixed');
    }
    
    // Get all rooms to check consistency
    const allRooms = await prisma.room.findMany({
      include: {
        property: {
          include: {
            owner: {
              select: {
                email: true,
                id: true
              }
            }
          }
        }
      }
    });
    
    console.log('\n📊 Checking all rooms for ownership consistency...');
    let inconsistentRooms = 0;
    
    allRooms.forEach(room => {
      if (room.ownerId !== room.property.ownerId) {
        console.log(`❌ Inconsistent: ${room.name} - Room owner: ${room.ownerId}, Property owner: ${room.property.ownerId}`);
        inconsistentRooms++;
      }
    });
    
    if (inconsistentRooms === 0) {
      console.log('✅ All rooms have consistent ownership');
    } else {
      console.log(`\n🔧 Fixing ${inconsistentRooms} inconsistent rooms...`);
      
      for (const room of allRooms) {
        if (room.ownerId !== room.property.ownerId) {
          await prisma.room.update({
            where: { id: room.id },
            data: { ownerId: room.property.ownerId }
          });
          console.log(`   ✅ Fixed: ${room.name}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoomOwnership();
