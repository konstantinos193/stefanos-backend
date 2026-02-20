import { PrismaClient } from './prisma/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function checkPermissions() {
  console.log('🔍 Checking user permissions for Incanto Hotel...');
  
  // Get all users with their roles
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'PROPERTY_OWNER', 'MANAGER']
      }
    },
    select: {
      email: true,
      name: true,
      role: true,
      isActive: true
    }
  });
  
  console.log('\n👥 Admin Users:');
  users.forEach(user => {
    console.log(`   ${user.email} - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
  });
  
  // Get Incanto property and its owner
  const incanto = await prisma.property.findFirst({
    where: { titleEn: { contains: 'Incanto' } },
    include: {
      owner: {
        select: {
          email: true,
          name: true,
          role: true
        }
      }
    }
  });
  
  if (incanto) {
    console.log(`\n🏨 Incanto Hotel Owner: ${incanto.owner.email} (${incanto.owner.role})`);
    
    console.log('\n📋 Who can modify Incanto Hotel:');
    console.log('✅ ADMIN users - Full access to all properties');
    console.log('✅ PROPERTY_OWNER users - Access to their own properties');
    console.log('✅ MANAGER users - Access to assigned properties');
    
    console.log('\n🔐 Current Access Levels:');
    users.forEach(user => {
      if (user.role === 'ADMIN') {
        console.log(`   ${user.email} - Can modify ALL properties including Incanto`);
      } else if (user.role === 'PROPERTY_OWNER' && user.email === incanto.owner.email) {
        console.log(`   ${user.email} - Can modify Incanto (property owner)`);
      } else if (user.role === 'MANAGER') {
        console.log(`   ${user.email} - Can modify Incanto if assigned as manager`);
      }
    });
  }
  
  await prisma.$disconnect();
}

checkPermissions().catch(console.error);
