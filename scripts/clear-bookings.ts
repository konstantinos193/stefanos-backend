import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: databaseUrl }),
});

async function main() {
  const count = await prisma.booking.count();
  console.log(`Found ${count} bookings in database`);

  if (count === 0) {
    console.log('No bookings to delete.');
    return;
  }

  const result = await prisma.booking.deleteMany({});
  console.log(`Deleted ${result.count} bookings successfully.`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma['$disconnect']();
  });
