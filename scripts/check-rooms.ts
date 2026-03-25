import { PrismaClient } from '../prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }) });
async function main() {
  const rooms = await prisma.room.findMany({ select: { id: true, name: true, type: true, createdAt: true }, orderBy: { createdAt: 'asc' } });
  console.log('Total rooms:', rooms.length);
  rooms.forEach(r => console.log(r.id.slice(0,8), '|', r.type, '|', r.createdAt.toISOString().slice(0,19), '|', r.name));
}
main().finally(() => prisma.$disconnect());
