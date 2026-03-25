import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }),
});

async function updateRoom2Images() {
  // Find Room 2
  const room = await prisma.room.findFirst({
    where: { nameEn: { contains: 'Luxury Apartment 02' } },
  });

  if (!room) {
    console.error('Room 2 not found');
    return;
  }

  // New images with thumbnail first
  const newImages = [
    '/2. ground floor No2/MTS_0959-Edit-2.jpg',
    '/2. ground floor No2/MTS_0940-Edit-2.jpg',
    '/2. ground floor No2/MTS_0971.jpg',
    '/2. ground floor No2/NZ6_5289-Edit.jpg',
    '/2. ground floor No2/NZ6_5296.jpg',
    '/2. ground floor No2/NZ6_5302.jpg',
    '/2. ground floor No2/NZ6_5303-Edit.jpg',
    '/2. ground floor No2/NZ6_5312.jpg',
    '/2. ground floor No2/NZ6_5314.jpg',
    '/2. ground floor No2/NZ6_5315.jpg',
    '/2. ground floor No2/NZ6_5340.jpg',
    '/2. ground floor No2/NZ6_5351.jpg',
    '/2. ground floor No2/NZ6_5354.jpg'
  ];

  // Update only the images
  await prisma.room.update({
    where: { id: room.id },
    data: { images: newImages },
  });

  console.log(`✅ Updated Room 2 images (${newImages.length} images)`);
  console.log('New thumbnail: MTS_0959-Edit-2.jpg');

  await prisma.$disconnect();
}

updateRoom2Images().catch(console.error);
