const { PrismaClient } = require('./prisma/generated/prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
require('dotenv').config();

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL }),
});

async function checkApartment3Pricing() {
  try {
    // Find Apartment 03
    const apartment3 = await prisma.room.findFirst({
      where: { 
        nameEn: { contains: 'Apartment 03' } 
      },
      include: {
        property: {
          select: {
            id: true,
            titleEn: true,
            basePrice: true,
            cleaningFee: true,
            serviceFeePercentage: true,
            taxRate: true,
            currency: true
          }
        }
      }
    });

    if (!apartment3) {
      console.log('Apartment 03 not found');
      return;
    }

    console.log('=== APARTMENT 03 PRICING BREAKDOWN ===\n');
    console.log(`Room: ${apartment3.nameEn}`);
    console.log(`Room Base Price: €${apartment3.basePrice}`);
    console.log(`Property: ${apartment3.property.titleEn}`);
    console.log(`Property Base Price: €${apartment3.property.basePrice}`);
    console.log(`Cleaning Fee: €${apartment3.property.cleaningFee || 0}`);
    console.log(`Service Fee: ${apartment3.property.serviceFeePercentage || 10}%`);
    console.log(`Tax Rate: ${apartment3.property.taxRate || 24}%`);
    
    // Calculate pricing for 3 nights using the same logic as the backend (NO FEES)
    const nights = 3;
    const basePrice = apartment3.basePrice; // Room's base price
    const subtotal = basePrice * nights;
    const cleaningFee = 0; // No cleaning fee
    const serviceFee = 0; // No service fee
    const taxes = 0; // No tax
    const totalPrice = subtotal + cleaningFee + serviceFee + taxes;
    
    console.log(`\n3-NIGHT CALCULATION (NO FEES):`);
    console.log(`  Base Price: €${basePrice} × ${nights} nights = €${subtotal.toFixed(2)}`);
    console.log(`  Cleaning Fee: €${cleaningFee.toFixed(2)}`);
    console.log(`  Service Fee: €${serviceFee.toFixed(2)}`);
    console.log(`  Taxes: €${taxes.toFixed(2)}`);
    console.log(`  TOTAL PRICE: €${totalPrice.toFixed(2)}`);
    
    console.log(`\nEXPECTED: €270`);
    console.log(`CALCULATED: €${totalPrice.toFixed(2)}`);
    console.log(`DIFFERENCE: €${(totalPrice - 270).toFixed(2)}`);
    
    // Check if there are any availability rules that might affect pricing
    const availabilityRules = await prisma.roomAvailabilityRule.findMany({
      where: { 
        roomId: apartment3.id,
        isAvailable: true
      }
    });
    
    if (availabilityRules.length > 0) {
      console.log(`\nAVAILABILITY RULES (${availabilityRules.length}):`);
      availabilityRules.forEach(rule => {
        console.log(`  ${rule.startDate} to ${rule.endDate}: €${rule.priceOverride || 'No override'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApartment3Pricing();
