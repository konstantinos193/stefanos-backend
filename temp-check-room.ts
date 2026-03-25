import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }),
});

async function checkRoom() {
  const room = await prisma.room.findFirst({
    where: { nameEn: { contains: 'Luxury Apartment 02' } },
  });
  
  if (room) {
    console.log('Room found:', room.nameEn);
    console.log('Type:', room.type);
    console.log('Capacity:', room.capacity);
    console.log('Base Price:', room.basePrice);
    console.log('Images field type:', typeof room.images);
    
    if (typeof room.images === 'string') {
      console.log('Images (string):', room.images);
    } else {
      console.log('Images (JSON):', room.images);
    }
  } else {
    console.log('Room not found');
  }
  
  await prisma.$disconnect();
}

checkRoom().catch(console.error);
