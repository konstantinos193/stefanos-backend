import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function checkRooms() {
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });
  
  if (incanto) {
    const rooms = await prisma.room.findMany({
      where: { propertyId: incanto.id },
      select: { name: true, amenities: true }
    });
    
    console.log('Current Incanto rooms and amenities:');
    rooms.forEach(room => {
      console.log(`${room.name}:`);
      console.log(`  Amenities: ${JSON.stringify(room.amenities)}`);
      console.log('');
    });
  } else {
    console.log('Incanto property not found');
  }
  
  await prisma.$disconnect();
}

checkRooms().catch(console.error);
