import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function updateAmenities() {
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
  });
  
  if (!incanto) {
    console.log('Incanto property not found');
    return;
  }

  const rooms = await prisma.room.findMany({
    where: { propertyId: incanto.id },
  });

  console.log(`Updating ${rooms.length} rooms...`);

  for (const room of rooms) {
    let updatedAmenities = [...(room.amenities as string[] || [])];
    
    // Remove coffee-related amenities
    updatedAmenities = updatedAmenities.filter(a => 
      !a.includes('Coffee') && 
      !a.includes('coffee')
    );
    
    // Add new amenities if not already present
    if (!updatedAmenities.includes('Free TV Channels')) {
      updatedAmenities.push('Free TV Channels');
    }
    if (!updatedAmenities.includes('Free Air Conditioning')) {
      updatedAmenities.push('Free Air Conditioning');
    }

    await prisma.room.update({
      where: { id: room.id },
      data: { amenities: updatedAmenities },
    });

    console.log(`Updated ${room.name}:`);
    console.log(`  Old: ${JSON.stringify(room.amenities)}`);
    console.log(`  New: ${JSON.stringify(updatedAmenities)}`);
    console.log('');
  }
  
  console.log('Done updating amenities!');
  await prisma.$disconnect();
}

updateAmenities().catch(console.error);
