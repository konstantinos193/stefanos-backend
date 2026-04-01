import { PrismaClient } from './prisma/generated/prisma';
import { createClient } from 'libsql-client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import dotenv from 'dotenv';

dotenv.config();

// Create a custom Prisma client with Turso adapter
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

// Italian translations for rooms
const italianRoomTranslations: Record<string, string> = {
  'Apartment 01 – Ground Level': 'Appartamento 01 – Piano Terra',
  'Apartment 02 – Ground Level': 'Appartamento 02 – Piano Terra',
  'Apartment 03 – First Floor': 'Appartamento 03 – Primo Piano',
  'Apartment 04 – First Floor': 'Appartamento 04 – Primo Piano',
  'Apartment 05 – First Floor': 'Appartamento 05 – Primo Piano',
  'Apartment 06 – Second Floor': 'Appartamento 06 – Secondo Piano',
  'Apartment 07 – Second Floor': 'Appartamento 07 – Secondo Piano',
  'Apartment 08 – Second Floor': 'Appartamento 08 – Secondo Piano',
  'Apartment 09 – Third Floor': 'Appartamento 09 – Terzo Piano',
  'Apartment 10 – Third Floor': 'Appartamento 10 – Terzo Piano',
};

// Italian descriptions for rooms
const italianRoomDescriptions: Record<string, string> = {
  'Apartment 01 – Ground Level': 'Un appartamento al piano terra raffinato e progettato per il comfort e l\'eleganza senza sforzo. Caratterizzato da un layout spazioso, arredi moderni e accesso diretto, questa residenza offre un\'atmosfera calma e privata ideale per il relax. Stilizzato con attenzione con dettagli premium, combina funzionalità con lusso discreto per un soggiorno veramente confortevole.',
  'Apartment 02 – Ground Level': 'Un appartamento al piano terra raffinato e progettato per il comfort e l\'eleganza senza sforzo. Caratterizzato da un layout spazioso, arredi moderni e accesso diretto, questa residenza offre un\'atmosfera calma e privata ideale per il relax. Stilizzato con attenzione con dettagli premium, combina funzionalità con lusso discreto per un soggiorno veramente confortevole.',
  'Apartment 03 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 04 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 05 – First Floor': 'Un elegante appartamento al primo piano che offre viste panoramiche e un design moderno. Spazioso e luminoso, questo appartamento combina comfort contemporaneo con stile classico per un\'esperienza di soggiorno indimenticabile.',
  'Apartment 06 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 07 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 08 – Second Floor': 'Un sofisticato appartamento al secondo piano con viste mozzafiato. Questo spazio ben progettato offre il perfetto equilibrio tra lusso e funzionalità, ideale per viaggiatori esigenti.',
  'Apartment 09 – Third Floor': 'Un lussuoso appartamento al terzo piano con viste spettacolari sul mare. Questo appartamento offre un\'esperienza di soggiorno premium con finiture di alta gamma e comfort moderni.',
  'Apartment 10 – Third Floor': 'Un lussuoso appartamento al terzo piano con viste spettacolari sul mare. Questo appartamento offre un\'esperienza di soggiorno premium con finiture di alta gamma e comfort moderni.',
};

// Italian translations for amenities
const italianAmenityTranslations: Record<string, string> = {
  'Sea View': 'Vista Mare',
  'Free WiFi': 'WiFi Gratuito',
  'Free Parking': 'Parcheggio Gratuito',
  'Free Air Conditioning': 'Aria Condizionata Gratuita',
  'Satellite TV Channels': 'Canali TV Satellitari',
  'Fully Equipped Kitchen': 'Cucina Completamente Attrezzata',
  'Fully Equipped Bathroom': 'Bagno Completamente Attrezzato',
  'Laundry': 'Lavanderia',
  'Free Laundry Service': 'Servizio Lavanderia Gratuito',
  'Private Balcony or Ground Access': 'Balcone Privato o Accesso a Terra',
  'Pet Friendly': 'Ammessi Animali Domestici',
  'Dining Area': 'Area Pranzo',
};

async function addItalianTranslations() {
  try {
    console.log('Adding Italian translations to rooms...');
    
    // Update rooms with Italian translations
    const rooms = await prisma.room.findMany();
    
    for (const room of rooms) {
      const italianName = italianRoomTranslations[room.nameEn || room.name];
      const italianDescription = italianRoomDescriptions[room.nameEn || room.name];
      
      await prisma.room.update({
        where: { id: room.id },
        data: {
          nameIt: italianName || null,
          descriptionIt: italianDescription || null,
        },
      });
      
      console.log(`Updated room: ${room.nameEn || room.name} -> ${italianName}`);
    }
    
    // Update property with Italian title
    const properties = await prisma.property.findMany();
    
    for (const property of properties) {
      await prisma.property.update({
        where: { id: property.id },
        data: {
          titleIt: "L'Incanto Apartments",
          descriptionIt: "Soggiorni boutique fronte mare a Chroneika, Grecia. Prenota direttamente per appartamenti selezionati, comfort esclusivo e tariffe migliori.",
        },
      });
      
      console.log(`Updated property: ${property.titleEn}`);
    }
    
    // Update amenities with Italian translations
    const amenities = await prisma.amenity.findMany();
    
    for (const amenity of amenities) {
      const italianName = italianAmenityTranslations[amenity.nameEn] || amenity.nameEn;
      
      await prisma.amenity.update({
        where: { id: amenity.id },
        data: {
          nameIt: italianName,
        },
      });
      
      console.log(`Updated amenity: ${amenity.nameEn} -> ${italianName}`);
    }
    
    console.log('Italian translations added successfully!');
    
  } catch (error) {
    console.error('Error adding Italian translations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addItalianTranslations();
