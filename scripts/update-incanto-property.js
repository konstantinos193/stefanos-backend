const { PrismaClient } = require('../prisma/generated/prisma/client');

const prisma = new PrismaClient();

async function updateIncantoProperty() {
  try {
    console.log('Updating Incanto Hotel to Incanto Apartments...');
    
    // Update the property
    const updatedProperty = await prisma.property.updateMany({
      where: {
        titleEn: 'Incanto Hotel'
      },
      data: {
        titleEn: 'L\'Incanto Apartments',
        titleGr: 'L\'Incanto Apartments',
        descriptionEn: 'Exclusive apartment complexes in Preveza with panoramic views of the Ionian Sea. Luxury accommodation with excellent amenities.',
        descriptionGr: 'Αποκλειστικά συγκροτήματα διαμερισμάτων στην Πρέβεζα με πανοραμική θέα στο Ιόνιο Πέλαγος. Πολυτελείς διαμονή με εξαιρετικές παροχές.',
        type: 'APARTMENT'
      }
    });

    console.log(`Updated ${updatedProperty.count} properties`);
    console.log('✅ Incanto property updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating property:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateIncantoProperty();
